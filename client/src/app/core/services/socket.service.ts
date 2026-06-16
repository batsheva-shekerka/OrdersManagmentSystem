import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { io, Socket } from "socket.io-client";
import { environment } from "../../../environments/environment";
import { Order } from "../models/order.model";

@Injectable({ providedIn: "root" })
export class SocketService {
  private socket: Socket | null = null;

  connect(): void {
    if (!this.socket) {
      this.socket = io(environment.socketUrl);
    }
  }

  joinAdmin(): void {
    this.connect();
    this.socket?.emit("admin:join");
  }

  joinOrder(orderId: string): void {
    this.connect();
    this.socket?.emit("order:join", orderId);
  }

  onOrderNew(): Observable<Order> {
    return this.fromEvent<Order>("order:new");
  }

  onOrderStatusChanged(): Observable<Order> {
    return this.fromEvent<Order>("order:statusChanged");
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  private fromEvent<T>(event: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      this.connect();
      const handler = (data: T) => subscriber.next(data);
      this.socket?.on(event, handler);
      return () => this.socket?.off(event, handler);
    });
  }
}
