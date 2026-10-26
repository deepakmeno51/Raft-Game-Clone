import * as THREE from 'three';
import { RemotePlayer, SerializedStructure, WorldSaveData } from '../types/game';
import { createRemotePlayerMesh, updateRemotePlayerModel } from './models';

export interface MultiplayerCallbacks {
  onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'offline') => void;
  onPlayersChange: (players: RemotePlayer[]) => void;
  onRemoteStructurePlaced?: (structure: SerializedStructure) => void;
  onRemoteStructureDemolished?: (id: string) => void;
  onRemoteStructureUpdated?: (id: string, data: any) => void;
  onRemoteSharkDefeated?: () => void;
  onWorldSync?: (world: WorldSaveData) => void;
  onToast: (msg: string, color?: string) => void;
}

const PLAYER_PALETTE = [
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#84cc16', // Lime
  '#fb923c', // Orange
];

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  public localId: string = '';
  public localName: string = '';
  public localColor: string = '';
  public roomId: string = 'ocean-world-1';
  public isConnected: boolean = false;
  public remotePlayers = new Map<string, RemotePlayer>();
  public remoteMeshes = new Map<string, THREE.Group>();

  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private callbacks: MultiplayerCallbacks;
  private sendTimer: any = null;
  private reconnectTimeout: any = null;
  private shouldReconnect: boolean = true;

  constructor(scene: THREE.Scene, camera: THREE.Camera, callbacks: MultiplayerCallbacks) {
    this.scene = scene;
    this.camera = camera;
    this.callbacks = callbacks;

    // Load or generate local identity
    const savedName = localStorage.getItem('raft_player_name');
    const randomIdx = Math.floor(Math.random() * 99) + 1;
    this.localName = savedName || `Survivor #${randomIdx}`;
    this.localColor = PLAYER_PALETTE[Math.floor(Math.random() * PLAYER_PALETTE.length)];
    this.localId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  public setPlayerName(name: string) {
    this.localName = name.trim() || 'Survivor';
    localStorage.setItem('raft_player_name', this.localName);
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'player:update_profile',
        name: this.localName,
        color: this.localColor,
      }));
    }
  }

  public connect(roomId?: string) {
    if (roomId) this.roomId = roomId;
    this.shouldReconnect = true;
    this.callbacks.onStatusChange('connecting');

    try {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const host = window.location.host;
      const url = `${wsProtocol}//${host}/ws?room=${encodeURIComponent(this.roomId)}&name=${encodeURIComponent(this.localName)}&color=${encodeURIComponent(this.localColor)}&id=${encodeURIComponent(this.localId)}`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.callbacks.onStatusChange('connected');
        this.callbacks.onToast(`🌐 Joined multiplayer world: ${this.roomId}`, '#10b981');

        // Start 20Hz player sync
        if (this.sendTimer) clearInterval(this.sendTimer);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.callbacks.onStatusChange('disconnected');
        this.clearRemotePlayers();
        if (this.shouldReconnect) {
          this.reconnectTimeout = setTimeout(() => {
            if (this.shouldReconnect) this.connect();
          }, 3500);
        }
      };

      this.ws.onerror = () => {
        this.callbacks.onStatusChange('offline');
      };
    } catch (err) {
      this.callbacks.onStatusChange('offline');
    }
  }

  public disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.sendTimer) clearInterval(this.sendTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.clearRemotePlayers();
    this.callbacks.onStatusChange('offline');
  }

  private handleMessage(msg: any) {
    switch (msg.type) {
      case 'init': {
        if (msg.player) {
          this.localId = msg.player.id;
          if (msg.player.color) this.localColor = msg.player.color;
        }
        if (msg.world && this.callbacks.onWorldSync) {
          this.callbacks.onWorldSync(msg.world);
        }
        if (Array.isArray(msg.players)) {
          msg.players.forEach((p: RemotePlayer) => {
            if (p.id !== this.localId) {
              this.addOrUpdateRemotePlayer(p);
            }
          });
          this.callbacks.onPlayersChange(Array.from(this.remotePlayers.values()));
        }
        break;
      }

      case 'player:joined': {
        if (msg.player && msg.player.id !== this.localId) {
          this.addOrUpdateRemotePlayer(msg.player);
          this.callbacks.onToast(`👋 ${msg.player.name} joined the raft!`, msg.player.color || '#38bdf8');
          this.callbacks.onPlayersChange(Array.from(this.remotePlayers.values()));
        }
        break;
      }

      case 'player:left': {
        if (msg.id) {
          const p = this.remotePlayers.get(msg.id);
          if (p) {
            this.callbacks.onToast(`⛵ ${p.name} left the world`, '#94a3b8');
          }
          this.removeRemotePlayer(msg.id);
          this.callbacks.onPlayersChange(Array.from(this.remotePlayers.values()));
        }
        break;
      }

      case 'player:moved': {
        if (msg.id && msg.id !== this.localId) {
          const existing = this.remotePlayers.get(msg.id);
          if (existing) {
            existing.x = msg.x;
            existing.y = msg.y;
            existing.z = msg.z;
            existing.yaw = msg.yaw;
            existing.pitch = msg.pitch;
            existing.health = msg.health;
            existing.maxHealth = msg.maxHealth || 100;
            existing.isSwimming = msg.isSwimming;
            existing.lastUpdated = Date.now();
          } else {
            this.addOrUpdateRemotePlayer({
              id: msg.id,
              name: msg.name || 'Survivor',
              color: msg.color || '#38bdf8',
              x: msg.x,
              y: msg.y,
              z: msg.z,
              yaw: msg.yaw,
              pitch: msg.pitch,
              health: msg.health,
              maxHealth: msg.maxHealth || 100,
              isSwimming: msg.isSwimming,
              lastUpdated: Date.now(),
            });
          }
        }
        break;
      }

      case 'structure:placed': {
        if (msg.structure && this.callbacks.onRemoteStructurePlaced) {
          this.callbacks.onRemoteStructurePlaced(msg.structure);
          this.callbacks.onToast(`🔨 ${msg.playerName || 'A survivor'} built ${msg.structure.type}!`, '#22c55e');
        }
        break;
      }

      case 'structure:demolished': {
        if (msg.id && this.callbacks.onRemoteStructureDemolished) {
          this.callbacks.onRemoteStructureDemolished(msg.id);
        }
        break;
      }

      case 'structure:updated': {
        if (msg.id && this.callbacks.onRemoteStructureUpdated) {
          this.callbacks.onRemoteStructureUpdated(msg.id, msg.data);
        }
        break;
      }

      case 'shark:defeated': {
        if (this.callbacks.onRemoteSharkDefeated) {
          this.callbacks.onRemoteSharkDefeated();
        }
        break;
      }
    }
  }

  private addOrUpdateRemotePlayer(p: RemotePlayer) {
    this.remotePlayers.set(p.id, p);
    if (!this.remoteMeshes.has(p.id)) {
      const mesh = createRemotePlayerMesh(p.color, p.name);
      mesh.position.set(p.x, p.y, p.z);
      mesh.rotation.y = p.yaw;
      this.scene.add(mesh);
      this.remoteMeshes.set(p.id, mesh);
    }
  }

  private removeRemotePlayer(id: string) {
    this.remotePlayers.delete(id);
    const mesh = this.remoteMeshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      this.remoteMeshes.delete(id);
    }
  }

  private clearRemotePlayers() {
    this.remoteMeshes.forEach((mesh) => this.scene.remove(mesh));
    this.remoteMeshes.clear();
    this.remotePlayers.clear();
    this.callbacks.onPlayersChange([]);
  }

  public update(dt: number, elapsed: number) {
    // Update each remote player 3D mesh
    this.remotePlayers.forEach((player, id) => {
      const mesh = this.remoteMeshes.get(id);
      if (mesh) {
        updateRemotePlayerModel(
          mesh,
          { x: player.x, y: player.y, z: player.z },
          player.yaw,
          player.health,
          player.maxHealth,
          player.isSwimming,
          this.camera,
          dt,
          elapsed
        );
      }
    });
  }

  public broadcastLocalMovement(
    pos: THREE.Vector3,
    yaw: number,
    pitch: number,
    health: number,
    maxHealth: number,
    isSwimming: boolean
  ) {
    if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'player:move',
      x: Math.round(pos.x * 100) / 100,
      y: Math.round(pos.y * 100) / 100,
      z: Math.round(pos.z * 100) / 100,
      yaw: Math.round(yaw * 100) / 100,
      pitch: Math.round(pitch * 100) / 100,
      health: Math.round(health),
      maxHealth: Math.round(maxHealth),
      isSwimming,
    }));
  }

  public broadcastStructurePlaced(structure: SerializedStructure) {
    if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'structure:place',
      structure,
      playerName: this.localName,
    }));
  }

  public broadcastStructureDemolished(id: string) {
    if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'structure:demolish',
      id,
    }));
  }

  public broadcastStructureUpdated(id: string, data: any) {
    if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'structure:update',
      id,
      data,
    }));
  }

  public broadcastSharkDefeated() {
    if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'shark:defeat',
    }));
  }
}
