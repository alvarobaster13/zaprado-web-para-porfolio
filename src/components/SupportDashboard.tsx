import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  User, 
  Package, 
  FileText,
  Send,
  Loader2,
  Inbox,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { processIncident, ExtractedInfo, IncidentCategory } from '@/src/lib/gemini';

interface Incident extends ExtractedInfo {
  id: string;
  rawText: string;
  timestamp: Date;
  status: 'pending' | 'processed' | 'replied';
}

const CATEGORY_COLORS: Record<IncidentCategory, string> = {
  "Devolución": "bg-primary/10 text-primary border-primary/20",
  "Entrega Fallida": "bg-destructive/10 text-destructive border-destructive/20",
  "Cambio de Talla": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Facturación": "bg-green-500/10 text-green-500 border-green-500/20",
  "Otro": "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20",
};

export default function SupportDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: '1',
      customerName: 'Marta García',
      orderId: '#ZAP-98231',
      productName: 'Zapatillas Nike Air Max',
      reason: 'El producto llegó con la caja dañada y una mancha en el lateral.',
      category: 'Devolución',
      missingInfo: [],
      suggestedResponse: 'Hola Marta, lamentamos mucho que tus zapatillas no hayan llegado en perfectas condiciones. Hemos registrado tu incidencia. ¿Te gustaría un reemplazo o prefieres el reembolso directo?',
      rawText: 'Hola, recibí mis Nike Air Max ayer (pedido #ZAP-98231) pero la caja está destrozada y una de las zapatillas tiene una mancha negra. Quiero devolverlas.',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      status: 'pending'
    },
    {
      id: '2',
      customerName: 'Juan Pérez',
      orderId: undefined,
      productName: 'Camiseta Adidas',
      reason: 'No le queda bien la talla y quiere cambiarla.',
      category: 'Cambio de Talla',
      missingInfo: ['ID de pedido'],
      suggestedResponse: 'Hola Juan, estaremos encantados de ayudarte con el cambio de talla. Para poder localizar tu compra, ¿podrías facilitarnos el número de pedido que aparece en tu email de confirmación?',
      rawText: 'Hola Zaprado, compré una camiseta Adidas la semana pasada pero me queda muy pequeña. ¿Cómo puedo pedir una talla más?',
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      status: 'pending'
    },
    {
      id: '3',
      customerName: 'Elena Rodríguez',
      orderId: '#ZAP-77210',
      productName: 'Vestido de Verano',
      reason: 'El paquete figura como entregado pero no lo ha recibido.',
      category: 'Entrega Fallida',
      missingInfo: [],
      suggestedResponse: 'Hola Elena, sentimos las molestias. Hemos contactado con el transportista para verificar la entrega en el pedido #ZAP-77210. Te daremos una respuesta en menos de 24h.',
      rawText: 'Mi pedido #ZAP-77210 dice que fue entregado hoy a las 10am pero he estado en casa todo el día y no ha venido nadie. He preguntado a los vecinos y tampoco saben nada.',
      timestamp: new Date(Date.now() - 1000 * 60 * 180),
      status: 'pending'
    },
    {
      id: '4',
      customerName: 'Carlos Ruiz',
      orderId: '#ZAP-11029',
      productName: 'Varios artículos',
      reason: 'Se le ha cobrado dos veces el mismo pedido.',
      category: 'Facturación',
      missingInfo: [],
      suggestedResponse: 'Hola Carlos, hemos detectado el cargo duplicado en tu pedido #ZAP-11029. Ya hemos solicitado la devolución del importe extra a tu tarjeta, lo verás reflejado en 3-5 días hábiles.',
      rawText: 'Hola, me han pasado dos cargos de 89.90€ por el mismo pedido #ZAP-11029. Por favor, devuélvanme el dinero de uno de ellos.',
      timestamp: new Date(Date.now() - 1000 * 60 * 240),
      status: 'pending'
    },
    {
      id: '5',
      customerName: 'Sofía Martínez',
      orderId: undefined,
      productName: 'Pantalones Levi\'s',
      reason: 'Consulta sobre cuándo volverá a haber stock.',
      category: 'Otro',
      missingInfo: ['ID de pedido'],
      suggestedResponse: 'Hola Sofía, actualmente no tenemos fecha de reposición para los Levi\'s 501 en azul claro. Puedes suscribirte a la alerta de stock en la web para que te avisemos en cuanto lleguen.',
      rawText: 'Hola, ¿cuándo vais a tener más stock de los Levi\'s 501 en talla 30? Llevo semanas esperando.',
      timestamp: new Date(Date.now() - 1000 * 60 * 300),
      status: 'pending'
    },
    {
      id: '6',
      customerName: 'Diego López',
      orderId: '#ZAP-55432',
      productName: 'Chaqueta de Cuero',
      reason: 'Quiere cancelar el pedido antes de que se envíe.',
      category: 'Otro',
      missingInfo: [],
      suggestedResponse: 'Hola Diego, hemos procedido a la cancelación de tu pedido #ZAP-55432 tal como solicitaste. Recibirás el reembolso en tu método de pago original en los próximos días.',
      rawText: 'Hola, me gustaría cancelar mi pedido #ZAP-55432. Lo acabo de pedir hace 10 minutos pero me he equivocado de dirección.',
      timestamp: new Date(Date.now() - 1000 * 60 * 360),
      status: 'pending'
    }
  ]);
  const [archivedIncidents, setArchivedIncidents] = useState<Incident[]>([]);
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newEmailText, setNewEmailText] = useState('');
  const [senderName, setSenderName] = useState('');
  const [nextId, setNextId] = useState(7);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedIncident = incidents.find(i => i.id === selectedId);

  const handleProcess = async () => {
    if (!newEmailText.trim()) return;
    
    setIsProcessing(true);
    try {
      const result = await processIncident(newEmailText);
      const newIncident: Incident = {
        ...result,
        id: nextId.toString(),
        customerName: senderName || result.customerName,
        rawText: newEmailText,
        timestamp: new Date(),
        status: 'pending'
      };
      setIncidents(prev => [newIncident, ...prev]);
      setSelectedId(newIncident.id);
      setNewEmailText('');
      setSenderName('');
      setNextId(prev => prev + 1);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = (id: string) => {
    const incidentToArchive = incidents.find(i => i.id === id);
    if (incidentToArchive) {
      setArchivedIncidents(prev => [incidentToArchive, ...prev]);
      setIncidents(prev => prev.filter(i => i.id !== id));
    }
    if (selectedId === id) setSelectedId(null);
  };

  const handleUnarchive = (id: string) => {
    const incidentToRestore = archivedIncidents.find(i => i.id === id);
    if (incidentToRestore) {
      setIncidents(prev => [incidentToRestore, ...prev]);
      setArchivedIncidents(prev => prev.filter(i => i.id !== id));
    }
    if (selectedId === id) setSelectedId(null);
  };

  const handleEscalate = (id: string) => {
    const setter = view === 'active' ? setIncidents : setArchivedIncidents;
    setter(prev => prev.map(i => 
      i.id === id ? { ...i, category: 'Otro' as IncidentCategory, reason: `[ESCALADO] ${i.reason}` } : i
    ));
    alert(`Incidencia ${id} escalada al equipo de gestión.`);
  };

  const handleResolve = (id: string) => {
    const setter = view === 'active' ? setIncidents : setArchivedIncidents;
    setter(prev => prev.map(i => 
      i.id === id ? { ...i, status: 'replied' as const } : i
    ));
  };

  const updateIncidentField = (id: string, field: keyof Incident, value: any) => {
    const setter = view === 'active' ? setIncidents : setArchivedIncidents;
    setter(prev => prev.map(i => 
      i.id === id ? { ...i, [field]: value } : i
    ));
  };

  const currentList = view === 'active' ? incidents : archivedIncidents;

  const filteredIncidents = currentList.filter(i => 
    i.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.rawText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.id.padStart(3, '0').includes(searchQuery)
  );

  const formatId = (id: string) => `#${id.padStart(3, '0')}`;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-2 md:px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-8">
            <div className="text-base md:text-xl font-serif italic tracking-tight shrink-0">Zaprado <span className="text-primary not-italic font-sans font-bold">Support</span></div>
            <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <button 
                onClick={() => { setView('active'); setSelectedId(null); }}
                className={`${view === 'active' ? 'text-foreground border-b border-primary' : 'hover:text-foreground'} transition-colors pb-1`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => { setView('archived'); setSelectedId(null); }}
                className={`${view === 'archived' ? 'text-foreground border-b border-primary' : 'hover:text-foreground'} transition-colors pb-1`}
              >
                Archived
              </button>
              <a href="#" className="hover:text-foreground transition-colors">Analytics</a>
              <a href="#" className="hover:text-foreground transition-colors">Settings</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search incidents..." 
                className="pl-9 w-64 bg-card border-border text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="rounded-full border-border bg-card hover:bg-border">
              <User className="w-4 h-4 text-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-0 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-px bg-border">
        {/* Left Column: Input & List */}
        <div className={`lg:col-span-4 space-y-px bg-border ${selectedId ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-background p-4 md:p-5 space-y-4 h-full">
              <div className="space-y-1">
                <div className="font-serif italic text-[11px] text-primary">Caso Troncal</div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Automatización</h3>
              </div>

              <Card className="border-border bg-card shadow-none overflow-hidden rounded-none">
                <CardHeader className="py-2 px-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest">New Incident</CardTitle>
                    <Mail className="w-3 h-3 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                  <Input 
                    placeholder="Sender Name..."
                    className="h-8 border-border bg-background text-foreground text-xs focus-visible:ring-primary"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                  <Textarea 
                    placeholder="Paste email content..."
                    className="min-h-[80px] resize-none border-border bg-background text-foreground text-xs font-serif focus-visible:ring-primary"
                    value={newEmailText}
                    onChange={(e) => setNewEmailText(e.target.value)}
                  />
                  <Button 
                    className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-4 rounded-none uppercase tracking-widest text-[10px]"
                    onClick={handleProcess}
                    disabled={isProcessing || !newEmailText.trim()}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Triage Incident
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Recent Activity</h3>
                  <Badge variant="outline" className="font-mono text-[9px] border-border text-muted-foreground">{filteredIncidents.length} Items</Badge>
                </div>
                
                <ScrollArea className="h-64 lg:h-[calc(100vh-450px)]">
                  <div className="space-y-2 pr-4">
                    <AnimatePresence mode="popLayout">
                      {filteredIncidents.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Inbox className="w-12 h-12 mx-auto mb-4 opacity-10" />
                          <p className="text-xs">No incidents found</p>
                        </div>
                      ) : (
                        filteredIncidents.map((incident) => (
                          <motion.div
                            key={incident.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedId(incident.id)}
                          >
                            <div className={`cursor-pointer transition-all p-4 border border-border ${selectedId === incident.id ? 'bg-card border-primary' : 'bg-background hover:bg-card'}`}>
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold text-primary">{formatId(incident.id)}</span>
                                  <Badge variant="outline" className={`${CATEGORY_COLORS[incident.category]} border font-bold text-[9px] px-2 py-0 rounded-full`}>
                                    {incident.category.toUpperCase()}
                                  </Badge>
                                </div>
                                <span className="text-[9px] text-muted-foreground font-mono">
                                  {incident.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-bold text-xs truncate text-foreground">
                                  {incident.customerName || 'Unknown Customer'}
                                </h4>
                                {incident.missingInfo.length > 0 && (
                                  <AlertCircle className="w-3 h-3 text-primary shrink-0" />
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-1 font-serif italic">
                                "{incident.rawText}"
                              </p>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </div>
            </div>
        </div>

        {/* Right Column: Detail View */}
        <div className={`lg:col-span-8 bg-background p-4 md:p-8 ${!selectedId ? 'hidden lg:flex lg:items-center lg:justify-center' : 'block'}`}>
          <AnimatePresence mode="wait">
            {selectedIncident ? (
              <motion.div
                key={selectedIncident.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 md:space-y-12"
              >
                {/* Mobile Back Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="lg:hidden -ml-2 text-muted-foreground hover:text-primary mb-4"
                  onClick={() => setSelectedId(null)}
                >
                  <ArrowRight className="w-4 h-4 rotate-180 mr-2" />
                  Back to List
                </Button>

                {/* Header Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] md:text-xs font-mono font-bold bg-primary text-primary-foreground px-2 py-0.5">{formatId(selectedIncident.id)}</span>
                    <div className="font-serif italic text-primary text-xs md:text-sm">Extracción y Clasificación</div>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-light tracking-tight">Registro de Incidencia</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  <div className="space-y-1 border-b border-border pb-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">Customer</span>
                    <Input 
                      value={selectedIncident.customerName || ''} 
                      onChange={(e) => updateIncidentField(selectedIncident.id, 'customerName', e.target.value)}
                      className="h-8 bg-transparent border-none p-0 text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="Enter name..."
                    />
                  </div>
                  <div className="space-y-1 border-b border-border pb-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">Incident ID</span>
                    <div className="h-8 flex items-center text-sm font-mono font-bold text-primary">
                      {formatId(selectedIncident.id)}
                    </div>
                  </div>
                  <div className="space-y-1 border-b border-border pb-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">Category</span>
                    <select 
                      value={selectedIncident.category}
                      onChange={(e) => updateIncidentField(selectedIncident.id, 'category', e.target.value)}
                      className="h-8 bg-transparent border-none p-0 text-sm font-medium focus:ring-0 outline-none appearance-none w-full"
                    >
                      <option value="Devolución">Devolución</option>
                      <option value="Entrega Fallida">Entrega Fallida</option>
                      <option value="Cambio de Talla">Cambio de Talla</option>
                      <option value="Facturación">Facturación</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-1 border-b border-border pb-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">Order ID</span>
                    <Input 
                      value={selectedIncident.orderId || ''} 
                      onChange={(e) => updateIncidentField(selectedIncident.id, 'orderId', e.target.value)}
                      className="h-8 bg-transparent border-none p-0 text-sm font-mono font-bold text-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="No detectado"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">Detected Product</span>
                        <Input 
                          value={selectedIncident.productName || ''} 
                          onChange={(e) => updateIncidentField(selectedIncident.id, 'productName', e.target.value)}
                          className="h-8 bg-transparent border-none p-0 text-sm font-serif italic focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="Product name..."
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">Primary Reason</span>
                        <Textarea 
                          value={selectedIncident.reason || ''} 
                          onChange={(e) => updateIncidentField(selectedIncident.id, 'reason', e.target.value)}
                          className="min-h-[60px] bg-transparent border-none p-0 text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                          placeholder="Reason for contact..."
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">Original Message</span>
                      <div className="bg-card border border-border p-6 font-serif text-sm text-muted-foreground leading-relaxed italic">
                        "{selectedIncident.rawText}"
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-card border border-border p-8 space-y-6">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-primary block">Acción Sugerida</span>
                        <div className="text-sm font-bold">Enviar Respuesta Predefinida</div>
                      </div>
                      <Textarea 
                        value={selectedIncident.suggestedResponse}
                        onChange={(e) => updateIncidentField(selectedIncident.id, 'suggestedResponse', e.target.value)}
                        className="min-h-[100px] bg-transparent border-none p-0 text-sm text-foreground leading-relaxed font-serif italic border-l border-primary/30 pl-4 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                      />
                      <Button 
                        className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-6 rounded-none uppercase tracking-widest text-xs"
                        onClick={() => handleResolve(selectedIncident.id)}
                        disabled={selectedIncident.status === 'replied'}
                      >
                        {selectedIncident.status === 'replied' ? 'Notificado' : 'Registrar y Notificar'} <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 md:pt-12 border-t border-border">
                  <div className="mr-auto text-[10px] text-muted-foreground font-mono flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 md:mb-0">
                    <span>Agente: AI-Engine v2.4</span>
                    <span>Latencia: 142ms</span>
                    {selectedIncident.status === 'replied' && (
                      <span className="text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> RESOLVIDO
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    {view === 'active' ? (
                      <Button 
                        variant="ghost" 
                        className="flex-1 md:flex-none text-[10px] uppercase font-bold tracking-widest hover:text-primary"
                        onClick={() => handleArchive(selectedIncident.id)}
                      >
                        Archive
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        className="flex-1 md:flex-none text-[10px] uppercase font-bold tracking-widest hover:text-primary"
                        onClick={() => handleUnarchive(selectedIncident.id)}
                      >
                        Restore
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      className="flex-1 md:flex-none text-[10px] uppercase font-bold tracking-widest hover:text-primary"
                      onClick={() => handleEscalate(selectedIncident.id)}
                    >
                      Escalate
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <div className="w-24 h-24 border border-border flex items-center justify-center mb-8 rotate-45">
                  <Inbox className="w-10 h-10 opacity-10 -rotate-45" />
                </div>
                <h3 className="text-lg font-serif italic text-foreground mb-2">Select an incident</h3>
                <p className="text-center max-w-xs text-[11px] uppercase tracking-widest leading-loose">
                  Choose an incident from the list to view extraction and classification data.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
