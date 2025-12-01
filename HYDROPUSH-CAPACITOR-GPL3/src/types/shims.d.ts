// /src/types/shims.d.ts

// Interfaces para o plugin cordova-plugin-local-notification
// Baseado na documentação oficial do plugin

interface ILocalNotificationAction {
  id: string;
  title: string;
  launch?: boolean;
  ui?: string;
  needsAuth?: boolean;
  icon?: string;
  actions?: ILocalNotificationActionGroup[];
}

interface ILocalNotificationActionGroup {
  id: string;
  title: string;
  actions: ILocalNotificationAction[];
}


interface ILocalNotification {
  schedule(options: any, callback?: (notification: any) => void, scope?: any): void;
  update(options: any, callback?: (notification: any) => void, scope?: any): void;
  clear(ids: number | number[] | string | string[], callback?: () => void, scope?: any): void;
  clearAll(callback?: () => void, scope?: any): void;
  cancel(ids: number | number[] | string | string[], callback?: () => void, scope?: any): void;
  cancelAll(callback?: () => void, scope?: any): void;
  isPresent(id: number | string, callback: (present: boolean) => void, scope?: any): void;
  isScheduled(id: number | string, callback: (scheduled: boolean) => void, scope?: any): void;
  isTriggered(id: number | string, callback: (triggered: boolean) => void, scope?: any): void;
  hasPermission(callback: (granted: boolean) => void, scope?: any): void;
  requestPermission(callback: (granted: boolean) => void, scope?: any): void;
  get(ids: number | number[] | string | string[], callback: (notifications: any[]) => void, scope?: any): void;
  getAll(callback: (notifications: any[]) => void, scope?: any): void;
  getScheduled(callback: (notifications: any[]) => void, scope?: any): void;
  getTriggered(callback: (notifications: any[]) => void, scope?: any): void;
}

// Estender a interface global do Window
declare global {
  interface Window {
    cordova?: {
      plugins?: {
        notification: {
          local: ILocalNotification;
        };
      };
    };
    // Definição para o plugin de SQLite, caso você decida usar
    sqlitePlugin?: {
      openDatabase: (options: any, success?: (db: any) => void, error?: (err: any) => void) => any;
    };
  }
}

// É necessário exportar algo para que o arquivo seja tratado como um módulo
export { };