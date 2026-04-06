'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Eye, Plus, Calendar, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getDispatches, generateInvoiceFromDispatch } from '@/lib/api/commission';

interface Dispatch {
  id: number;
  dispatch_id: string;
  lifting_date: string;
  deal_id: string;
  commodity: string;
  buyer_name: string;
  seller_name: string;
  receiver_name: string;
  quantity_mt: number;
  rate: number;
  buyer_commission: number;
  seller_commission: number;
  total_amount: number;
  payment_status: string;
  invoice_generated: boolean;
  invoice_number?: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  dispatch_id: string;
  party_code: string;
  party_name: string;
  party_type: 'buyer' | 'seller';
  commodity: string;
  quantity: number;
  rate: number;
  commission_amount: number;
  total_amount: number;
  gst_amount: number;
  net_amount: number;
  status: 'draft' | 'generated' | 'sent' | 'paid';
}

export default function CommissionInvoicesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('generate');
  const [isLoading, setIsLoading] = useState(false);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  // Invoice generation form
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_date: '',
    party_type: 'buyer' as 'buyer' | 'seller',
    gst_percentage: 18,
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'generate') {
        const dispatchesData = await getDispatches();
        const dispatchList = dispatchesData.results || dispatchesData;
        // Filter dispatches that don't have invoices generated yet
        const uninvoicedDispatches = dispatchList.filter((d: Dispatch) => !d.invoice_generated);
        setDispatches(uninvoicedDispatches);
      } else if (activeTab === 'manage') {
        // Load invoices - this would need a new API endpoint
        // For now, we'll show a placeholder
        setInvoices([]);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInvoice = async (dispatch: Dispatch) => {
    setSelectedDispatch(dispatch);
    setInvoiceForm({
      invoice_date: new Date().toISOString().split('T')[0],
      party_type: 'buyer',
      gst_percentage: 18,
      remarks: `Invoice for dispatch ${dispatch.dispatch_id}`
    });
    setInvoiceDialogOpen(true);
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispatch) return;

    try {
      const invoiceData = {
        dispatch_id: selectedDispatch.dispatch_id,
        invoice_date: invoiceForm.invoice_date,
        party_type: invoiceForm.party_type,
        gst_percentage: invoiceForm.gst_percentage,
        remarks: invoiceForm.remarks
      };

      await generateInvoiceFromDispatch(selectedDispatch.id, invoiceData);
      toast({
        title: 'Success',
        description: 'Invoice generated successfully',
      });
      setInvoiceDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to generate invoice',
        variant: 'destructive',
      });
    }
  };

  const downloadInvoice = (invoice: Invoice) => {
    // This would typically call an API to generate and download the PDF
    toast({
      title: 'Download Started',
      description: `Downloading invoice ${invoice.invoice_number}`,
    });
  };

  const viewInvoice = (invoice: Invoice) => {
    // This would open the invoice in a modal or new tab
    toast({
      title: 'View Invoice',
      description: `Opening invoice ${invoice.invoice_number}`,
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Commission Invoices</h1>
          <p className="text-muted-foreground">
            Generate and manage invoices for commission dispatches
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Invoices</TabsTrigger>
          <TabsTrigger value="manage">Manage Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Pending Invoice Generation
              </CardTitle>
              <CardDescription>
                Generate invoices for dispatches that don't have invoices yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dispatches.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Pending Invoices</h3>
                  <p className="text-muted-foreground">
                    All dispatches have invoices generated.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispatch ID</TableHead>
                      <TableHead>Lifting Date</TableHead>
                      <TableHead>Deal ID</TableHead>
                      <TableHead>Commodity</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead className="text-right">Quantity (MT)</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispatches.map((dispatch) => (
                      <TableRow key={dispatch.id}>
                        <TableCell className="font-medium">{dispatch.dispatch_id}</TableCell>
                        <TableCell>{new Date(dispatch.lifting_date).toLocaleDateString()}</TableCell>
                        <TableCell>{dispatch.deal_id}</TableCell>
                        <TableCell>{dispatch.commodity}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{dispatch.buyer_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{dispatch.seller_name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{dispatch.quantity_mt}</TableCell>
                        <TableCell className="text-right font-medium">₹{dispatch.total_amount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={dispatch.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {dispatch.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleGenerateInvoice(dispatch)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Generate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Generated Invoices
              </CardTitle>
              <CardDescription>
                View and manage all generated invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Invoices Found</h3>
                  <p className="text-muted-foreground">
                    No invoices have been generated yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Dispatch ID</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Commodity</TableHead>
                      <TableHead className="text-right">Net Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                        <TableCell>{invoice.dispatch_id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice.party_code}</div>
                            <div className="text-sm text-muted-foreground">{invoice.party_name}</div>
                            <Badge variant="outline" className="text-xs">{invoice.party_type}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>{invoice.commodity}</TableCell>
                        <TableCell className="text-right font-medium">₹{invoice.net_amount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            invoice.status === 'paid' ? 'default' :
                            invoice.status === 'sent' ? 'secondary' : 'outline'
                          }>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewInvoice(invoice)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadInvoice(invoice)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Generation Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Generate invoice for dispatch {selectedDispatch?.dispatch_id}
            </DialogDescription>
          </DialogHeader>

          {selectedDispatch && (
            <div className="space-y-4">
              {/* Dispatch Summary */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Dispatch ID:</span> {selectedDispatch.dispatch_id}
                    </div>
                    <div>
                      <span className="font-medium">Deal ID:</span> {selectedDispatch.deal_id}
                    </div>
                    <div>
                      <span className="font-medium">Commodity:</span> {selectedDispatch.commodity}
                    </div>
                    <div>
                      <span className="font-medium">Quantity:</span> {selectedDispatch.quantity_mt} MT
                    </div>
                    <div>
                      <span className="font-medium">Buyer:</span> {selectedDispatch.buyer_name}
                    </div>
                    <div>
                      <span className="font-medium">Seller:</span> {selectedDispatch.seller_name}
                    </div>
                    <div>
                      <span className="font-medium">Rate:</span> ₹{selectedDispatch.rate}
                    </div>
                    <div>
                      <span className="font-medium">Total Amount:</span> ₹{selectedDispatch.total_amount?.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <form onSubmit={handleInvoiceSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoice-date">Invoice Date</Label>
                    <Input
                      id="invoice-date"
                      type="date"
                      value={invoiceForm.invoice_date}
                      onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoice_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="party-type">Invoice For</Label>
                    <Select value={invoiceForm.party_type} onValueChange={(value: 'buyer' | 'seller') => setInvoiceForm(prev => ({ ...prev, party_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">Buyer (Commission Receivable)</SelectItem>
                        <SelectItem value="seller">Seller (Commission Receivable)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="gst-percentage">GST Percentage</Label>
                    <Input
                      id="gst-percentage"
                      type="number"
                      step="0.01"
                      value={invoiceForm.gst_percentage}
                      onChange={(e) => setInvoiceForm(prev => ({ ...prev, gst_percentage: parseFloat(e.target.value) }))}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={invoiceForm.remarks}
                      onChange={(e) => setInvoiceForm(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Invoice Preview */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Invoice Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Commission Amount:</span>
                        <span>₹{invoiceForm.party_type === 'buyer' ? selectedDispatch.buyer_commission : selectedDispatch.seller_commission}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST ({invoiceForm.gst_percentage}%):</span>
                        <span>₹{((invoiceForm.party_type === 'buyer' ? selectedDispatch.buyer_commission : selectedDispatch.seller_commission) * invoiceForm.gst_percentage / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-2">
                        <span>Net Amount:</span>
                        <span>₹{(
                          (invoiceForm.party_type === 'buyer' ? selectedDispatch.buyer_commission : selectedDispatch.seller_commission) +
                          ((invoiceForm.party_type === 'buyer' ? selectedDispatch.buyer_commission : selectedDispatch.seller_commission) * invoiceForm.gst_percentage / 100)
                        ).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Invoice
                  </Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}