export type Role = 'manager' | 'admin' | 'operator' | 'technology' | 'client';
export type Unit = 'unidad' | 'gruesa' | '100pares';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  clientId?: string;
  enabled?: boolean;
}

export interface PublicArticle {
  id: string;
  code: string;
  name: string;
  material: string;
  color: string;
  threads: number;
  lengthCm: number;
  weave: string;
  unit: string;
  public: true;
}

export interface Article extends Omit<PublicArticle, 'public'> {
  public: boolean;
  costCents?: number;
  priceCents?: number;
  stale?: boolean;
  bom?: Array<{ insumoId: string; gramsPerUnit: number }>;
  machineIds?: string[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  cuit: string;
}

export interface RequestRecord {
  id: string;
  clientId?: string;
  articleId: string | null;
  quantity: number;
  unit: Unit;
  special: boolean;
  notes: string;
  company: string;
  cuit: string;
  email: string;
  phone: string;
  status: 'Nueva' | 'Cotizada';
  createdAt: string;
}

export type QuoteStatus = 'Pendiente' | 'Enviada' | 'Aceptada' | 'Rechazada' | 'Vencida';

export interface Quote {
  id: string;
  number: string;
  requestId?: string;
  clientId: string;
  articleId: string;
  quantity: number;
  unit: Unit;
  units: number;
  markupPercent?: number;
  validDays: number;
  netCents: number;
  vatCents: number;
  totalCents: number;
  status: QuoteStatus;
  createdAt: string;
  expiresAt: string;
  staleAccepted?: boolean;
}

export type OrderStatus = 'Pendiente' | 'En producción' | 'Listo' | 'Entregado' | 'Pendiente de cobro' | 'Cobrado';

export interface Requirement {
  insumoId: string;
  requiredGrams: number;
  reservedGrams: number;
  consumedGrams: number;
  shortageGrams: number;
}

export interface OrderHistoryEntry {
  at: string;
  by?: string;
  action: string;
}

export interface Order {
  id: string;
  number: string;
  quoteId: string;
  clientId: string;
  articleId: string;
  quantity: number;
  unit: Unit;
  units: number;
  producedUnits: number;
  status: OrderStatus;
  dueDate: string;
  priority: number;
  machineId: string | null;
  qualityChecked: boolean;
  createdAt: string;
  requirements: Requirement[];
  history: OrderHistoryEntry[];
  /** dueDate < today (UTC) while still active; staff and operator only. */
  delayed?: boolean;
}

export interface Insumo {
  id: string;
  name: string;
  color: string;
  stockGrams: number;
  reservedGrams: number;
  availableGrams: number;
  minGrams: number;
  requiredGrams: number;
  shortageGrams: number;
  /** Physical stock strictly below the minimum. */
  belowMinimum?: boolean;
  priceCentsPerKg?: number;
  priceDate?: string;
}

export interface Machine {
  id: string;
  name: string;
  maxThreads: number;
  activeOrderId: string | null;
}

export interface NotificationRecord {
  id: string;
  orderId?: string;
  quoteId?: string;
  clientId?: string;
  event: string;
  recipient: string;
  channel: 'Email' | 'WhatsApp';
  status: 'Registrada' | 'Pendiente de reintento';
  subject: string;
  body: string;
  createdAt: string;
}

export interface Movement {
  id: string;
  insumoId: string;
  grams: number;
  type: 'Ingreso' | 'Consumo';
  orderId?: string;
  memo: string;
  createdAt: string;
}

export interface Settings {
  markupPercent: number;
  validDays: number;
  staleDays: number;
}

export interface Snapshot {
  user: User;
  articles: Article[];
  clients: Client[];
  requests: RequestRecord[];
  quotes: Quote[];
  orders: Order[];
  insumos: Insumo[];
  machines: Machine[];
  notifications: NotificationRecord[];
  movements: Movement[];
  users?: User[];
  settings: Settings;
}

export interface Estimate {
  available: boolean;
  reason?: string;
  netCents?: number;
  vatCents?: number;
  totalCents?: number;
  units?: number;
}
