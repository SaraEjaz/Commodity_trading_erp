'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Save, Receipt, CreditCard, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getPaymentReceived,
  createPaymentReceived,
  updatePaymentReceived,
  getThirdPartySettlements,
  createThirdPartySettlement,
  updateThirdPartySettlement,
  getCPR,
  createCPR,
  updateCPR
} from '@/lib/api/accounting';

interface PaymentReceived {
  id: number;
  payment_date: string;
  party_code: string;
  party_name: string;
  amount: number;
  payment_mode: 'cash' | 'cheque' | 'bank_transfer' | 'rtgs' | 'neft';
  reference_number: string;
  bank_name: string;
  remarks: string;
  status: 'pending' | 'cleared' | 'bounced';
}

interface ThirdPartySettlement {
  id: number;
  settlement_date: string;
  buyer_code: string;
  buyer_name: string;
  seller_code: string;
  seller_name: string;
  commodity: string;
  quantity: number;
  rate: number;
  buyer_commission: number;
  seller_commission: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'partially_paid';
  remarks: string;
}

interface CPR {
  id: number;
  cpr_date: string;
  buyer_code: string;
  buyer_name: string;
  seller_code: string;
  seller_name: string;
  commodity: string;
  quantity: number;
  rate: number;
  buyer_commission: number;
  seller_commission: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'partially_paid';
  remarks: string;
}

export default function CommissionPaymentsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('payments-received');
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [paymentsReceived, setPaymentsReceived] = useState<PaymentReceived[]>([]);
  const [thirdPartySettlements, setThirdPartySettlements] = useState<ThirdPartySettlement[]>([]);
  const [cprData, setCprData] = useState<CPR[]>([]);

  // Dialog states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [settlementDialogOpen, setSettlementDialogOpen] = useState(false);
  const [cprDialogOpen, setCprDialogOpen] = useState(false);

  // Form states
  const [editingPayment, setEditingPayment] = useState<PaymentReceived | null>(null);
  const [editingSettlement, setEditingSettlement] = useState<ThirdPartySettlement | null>(null);
  const [editingCpr, setEditingCpr] = useState<CPR | null>(null);

  // Form data
  const [paymentForm, setPaymentForm] = useState({
    payment_date: '',
    party_code: '',
    amount: 0,
    payment_mode: 'bank_transfer' as 'cash' | 'cheque' | 'bank_transfer' | 'rtgs' | 'neft',
    reference_number: '',
    bank_name: '',
    remarks: '',
    status: 'pending' as 'pending' | 'cleared' | 'bounced'
  });

  const [settlementForm, setSettlementForm] = useState({
    settlement_date: '',
    buyer_code: '',
    seller_code: '',
    commodity: '',
    quantity: 0,
    rate: 0,
    buyer_commission: 0,
    seller_commission: 0,
    payment_status: 'pending' as 'pending' | 'paid' | 'partially_paid',
    remarks: ''
  });

  const [cprForm, setCprForm] = useState({
    cpr_date: '',
    buyer_code: '',
    seller_code: '',
    commodity: '',
    quantity: 0,
    rate: 0,
    buyer_commission: 0,
    seller_commission: 0,
    payment_status: 'pending' as 'pending' | 'paid' | 'partially_paid',
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'payments-received':
          const paymentsData = await getPaymentReceived();
          setPaymentsReceived(paymentsData);
          break;
        case 'third-party-settlements':
          const settlementsData = await getThirdPartySettlements();
          setThirdPartySettlements(settlementsData);
          break;
        case 'cpr':
          const cprDataResponse = await getCPR();
          setCprData(cprDataResponse);
          break;
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

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPayment) {
        await updatePaymentReceived(editingPayment.id, paymentForm);
        toast({ title: 'Success', description: 'Payment updated successfully' });
      } else {
        await createPaymentReceived(paymentForm);
        toast({ title: 'Success', description: 'Payment recorded successfully' });
      }
      setPaymentDialogOpen(false);
      resetPaymentForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save payment',
        variant: 'destructive',
      });
    }
  };

  const handleSettlementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalAmount = (settlementForm.quantity * settlementForm.rate) + settlementForm.buyer_commission + settlementForm.seller_commission;
      const formData = { ...settlementForm, total_amount: totalAmount };

      if (editingSettlement) {
        await updateThirdPartySettlement(editingSettlement.id, formData);
        toast({ title: 'Success', description: 'Settlement updated successfully' });
      } else {
        await createThirdPartySettlement(formData);
        toast({ title: 'Success', description: 'Settlement recorded successfully' });
      }
      setSettlementDialogOpen(false);
      resetSettlementForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save settlement',
        variant: 'destructive',
      });
    }
  };

  const handleCprSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalAmount = (cprForm.quantity * cprForm.rate) + cprForm.buyer_commission + cprForm.seller_commission;
      const formData = { ...cprForm, total_amount: totalAmount };

      if (editingCpr) {
        await updateCPR(editingCpr.id, formData);
        toast({ title: 'Success', description: 'CPR updated successfully' });
      } else {
        await createCPR(formData);
        toast({ title: 'Success', description: 'CPR recorded successfully' });
      }
      setCprDialogOpen(false);
      resetCprForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save CPR',
        variant: 'destructive',
      });
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      payment_date: '',
      party_code: '',
      amount: 0,
      payment_mode: 'bank_transfer',
      reference_number: '',
      bank_name: '',
      remarks: '',
      status: 'pending'
    });
    setEditingPayment(null);
  };

  const resetSettlementForm = () => {
    setSettlementForm({
      settlement_date: '',
      buyer_code: '',
      seller_code: '',
      commodity: '',
      quantity: 0,
      rate: 0,
      buyer_commission: 0,
      seller_commission: 0,
      payment_status: 'pending',
      remarks: ''
    });
    setEditingSettlement(null);
  };

  const resetCprForm = () => {
    setCprForm({
      cpr_date: '',
      buyer_code: '',
      seller_code: '',
      commodity: '',
      quantity: 0,
      rate: 0,
      buyer_commission: 0,
      seller_commission: 0,
      payment_status: 'pending',
      remarks: ''
    });
    setEditingCpr(null);
  };

  const openPaymentDialog = (payment?: PaymentReceived) => {
    if (payment) {
      setEditingPayment(payment);
      setPaymentForm({
        payment_date: payment.payment_date,
        party_code: payment.party_code,
        amount: payment.amount,
        payment_mode: payment.payment_mode,
        reference_number: payment.reference_number,
        bank_name: payment.bank_name,
        remarks: payment.remarks,
        status: payment.status
      });
    } else {
      resetPaymentForm();
      setPaymentForm(prev => ({ ...prev, payment_date: new Date().toISOString().split('T')[0] }));
    }
    setPaymentDialogOpen(true);
  };

  const openSettlementDialog = (settlement?: ThirdPartySettlement) => {
    if (settlement) {
      setEditingSettlement(settlement);
      setSettlementForm({
        settlement_date: settlement.settlement_date,
        buyer_code: settlement.buyer_code,
        seller_code: settlement.seller_code,
        commodity: settlement.commodity,
        quantity: settlement.quantity,
        rate: settlement.rate,
        buyer_commission: settlement.buyer_commission,
        seller_commission: settlement.seller_commission,
        payment_status: settlement.payment_status,
        remarks: settlement.remarks
      });
    } else {
      resetSettlementForm();
      setSettlementForm(prev => ({ ...prev, settlement_date: new Date().toISOString().split('T')[0] }));
    }
    setSettlementDialogOpen(true);
  };

  const openCprDialog = (cpr?: CPR) => {
    if (cpr) {
      setEditingCpr(cpr);
      setCprForm({
        cpr_date: cpr.cpr_date,
        buyer_code: cpr.buyer_code,
        seller_code: cpr.seller_code,
        commodity: cpr.commodity,
        quantity: cpr.quantity,
        rate: cpr.rate,
        buyer_commission: cpr.buyer_commission,
        seller_commission: cpr.seller_commission,
        payment_status: cpr.payment_status,
        remarks: cpr.remarks
      });
    } else {
      resetCprForm();
      setCprForm(prev => ({ ...prev, cpr_date: new Date().toISOString().split('T')[0] }));
    }
    setCprDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Commission Payments</h1>
          <p className="text-muted-foreground">
            Manage payments, settlements, and commission processing reports
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payments-received">Payments Received</TabsTrigger>
          <TabsTrigger value="third-party-settlements">Third Party Settlements</TabsTrigger>
          <TabsTrigger value="cpr">Commission Processing Report</TabsTrigger>
        </TabsList>

        <TabsContent value="payments-received" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Payments Received
                </CardTitle>
                <CardDescription>Record and track commission payments received</CardDescription>
              </div>
              <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openPaymentDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingPayment ? 'Edit Payment' : 'Record New Payment'}</DialogTitle>
                    <DialogDescription>
                      Enter payment details below
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePaymentSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="payment-date">Payment Date</Label>
                          <Input
                            id="payment-date"
                            type="date"
                            value={paymentForm.payment_date}
                            onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="party-code">Party Code</Label>
                          <Input
                            id="party-code"
                            value={paymentForm.party_code}
                            onChange={(e) => setPaymentForm(prev => ({ ...prev, party_code: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="amount">Amount (₹)</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="payment-mode">Payment Mode</Label>
                          <Select value={paymentForm.payment_mode} onValueChange={(value: any) => setPaymentForm(prev => ({ ...prev, payment_mode: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="rtgs">RTGS</SelectItem>
                              <SelectItem value="neft">NEFT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="reference-number">Reference Number</Label>
                          <Input
                            id="reference-number"
                            value={paymentForm.reference_number}
                            onChange={(e) => setPaymentForm(prev => ({ ...prev, reference_number: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="bank-name">Bank Name</Label>
                          <Input
                            id="bank-name"
                            value={paymentForm.bank_name}
                            onChange={(e) => setPaymentForm(prev => ({ ...prev, bank_name: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={paymentForm.status} onValueChange={(value: any) => setPaymentForm(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="cleared">Cleared</SelectItem>
                            <SelectItem value="bounced">Bounced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="remarks">Remarks</Label>
                        <Textarea
                          id="remarks"
                          value={paymentForm.remarks}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, remarks: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        {editingPayment ? 'Update' : 'Record'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsReceived.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.party_code}</div>
                          <div className="text-sm text-muted-foreground">{payment.party_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">₹{payment.amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.payment_mode}</Badge>
                      </TableCell>
                      <TableCell>{payment.reference_number}</TableCell>
                      <TableCell>
                        <Badge variant={
                          payment.status === 'cleared' ? 'default' :
                          payment.status === 'bounced' ? 'destructive' : 'secondary'
                        }>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPaymentDialog(payment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="third-party-settlements" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Third Party Settlements
                </CardTitle>
                <CardDescription>Manage settlements between buyers and sellers</CardDescription>
              </div>
              <Dialog open={settlementDialogOpen} onOpenChange={setSettlementDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openSettlementDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Settlement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>{editingSettlement ? 'Edit Settlement' : 'New Third Party Settlement'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSettlementSubmit}>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div>
                        <Label htmlFor="settlement-date">Settlement Date</Label>
                        <Input
                          id="settlement-date"
                          type="date"
                          value={settlementForm.settlement_date}
                          onChange={(e) => setSettlementForm(prev => ({ ...prev, settlement_date: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="commodity">Commodity</Label>
                        <Input
                          id="commodity"
                          value={settlementForm.commodity}
                          onChange={(e) => setSettlementForm(prev => ({ ...prev, commodity: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="buyer-code">Buyer Code</Label>
                        <Input
                          id="buyer-code"
                          value={settlementForm.buyer_code}
                          onChange={(e) => setSettlementForm(prev => ({ ...prev, buyer_code: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="seller-code">Seller Code</Label>
                        <Input
                          id="seller-code"
                          value={settlementForm.seller_code}
                          onChange={(e) => setSettlementForm(prev => ({ ...prev, seller_code: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          step="0.01"
                          value={settlementForm.quantity}
                          onChange={(e) => setSettlementForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="rate">Rate</Label>
                        <Input
                          id="rate"
                          type="number"
                          step="0.01"
                          value={settlementForm.rate}
                          onChange={(e) => setSettlementForm(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="buyer-commission">Buyer Commission</Label>
                        <Input
                          id="buyer-commission"
                          type="number"
                          step="0.01"
                          value={settlementForm.buyer_commission}
                          onChange={(e) => setSettlementForm(prev => ({ ...prev, buyer_commission: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="seller-commission">Seller Commission</Label>
                        <Input
                          id="seller-commission"
                          type="number"
                          step="0.01"
                          value={settlementForm.seller_commission}
                          onChange={(e) => setSettlementForm(prev => ({ ...prev, seller_commission: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="payment-status">Payment Status</Label>
                        <Select value={settlementForm.payment_status} onValueChange={(value: any) => setSettlementForm(prev => ({ ...prev, payment_status: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="partially_paid">Partially Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="settlement-remarks">Remarks</Label>
                        <Textarea
                          id="settlement-remarks"
                          value={settlementForm.remarks}
                          onChange={(e) => setSettlementForm(prev => ({ ...prev, remarks: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setSettlementDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        {editingSettlement ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {thirdPartySettlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell>{new Date(settlement.settlement_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{settlement.buyer_code}</div>
                          <div className="text-sm text-muted-foreground">{settlement.buyer_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{settlement.seller_code}</div>
                          <div className="text-sm text-muted-foreground">{settlement.seller_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{settlement.commodity}</TableCell>
                      <TableCell className="text-right">{settlement.quantity}</TableCell>
                      <TableCell className="text-right font-medium">₹{settlement.total_amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          settlement.payment_status === 'paid' ? 'default' :
                          settlement.payment_status === 'partially_paid' ? 'secondary' : 'outline'
                        }>
                          {settlement.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSettlementDialog(settlement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cpr" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Commission Processing Report (CPR)
                </CardTitle>
                <CardDescription>Track commission processing and collections</CardDescription>
              </div>
              <Dialog open={cprDialogOpen} onOpenChange={setCprDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openCprDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    New CPR Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>{editingCpr ? 'Edit CPR Entry' : 'New CPR Entry'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCprSubmit}>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div>
                        <Label htmlFor="cpr-date">CPR Date</Label>
                        <Input
                          id="cpr-date"
                          type="date"
                          value={cprForm.cpr_date}
                          onChange={(e) => setCprForm(prev => ({ ...prev, cpr_date: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpr-commodity">Commodity</Label>
                        <Input
                          id="cpr-commodity"
                          value={cprForm.commodity}
                          onChange={(e) => setCprForm(prev => ({ ...prev, commodity: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpr-buyer-code">Buyer Code</Label>
                        <Input
                          id="cpr-buyer-code"
                          value={cprForm.buyer_code}
                          onChange={(e) => setCprForm(prev => ({ ...prev, buyer_code: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpr-seller-code">Seller Code</Label>
                        <Input
                          id="cpr-seller-code"
                          value={cprForm.seller_code}
                          onChange={(e) => setCprForm(prev => ({ ...prev, seller_code: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpr-quantity">Quantity</Label>
                        <Input
                          id="cpr-quantity"
                          type="number"
                          step="0.01"
                          value={cprForm.quantity}
                          onChange={(e) => setCprForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpr-rate">Rate</Label>
                        <Input
                          id="cpr-rate"
                          type="number"
                          step="0.01"
                          value={cprForm.rate}
                          onChange={(e) => setCprForm(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpr-buyer-commission">Buyer Commission</Label>
                        <Input
                          id="cpr-buyer-commission"
                          type="number"
                          step="0.01"
                          value={cprForm.buyer_commission}
                          onChange={(e) => setCprForm(prev => ({ ...prev, buyer_commission: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpr-seller-commission">Seller Commission</Label>
                        <Input
                          id="cpr-seller-commission"
                          type="number"
                          step="0.01"
                          value={cprForm.seller_commission}
                          onChange={(e) => setCprForm(prev => ({ ...prev, seller_commission: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpr-payment-status">Payment Status</Label>
                        <Select value={cprForm.payment_status} onValueChange={(value: any) => setCprForm(prev => ({ ...prev, payment_status: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="partially_paid">Partially Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="cpr-remarks">Remarks</Label>
                        <Textarea
                          id="cpr-remarks"
                          value={cprForm.remarks}
                          onChange={(e) => setCprForm(prev => ({ ...prev, remarks: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCprDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        {editingCpr ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cprData.map((cpr) => (
                    <TableRow key={cpr.id}>
                      <TableCell>{new Date(cpr.cpr_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cpr.buyer_code}</div>
                          <div className="text-sm text-muted-foreground">{cpr.buyer_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cpr.seller_code}</div>
                          <div className="text-sm text-muted-foreground">{cpr.seller_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{cpr.commodity}</TableCell>
                      <TableCell className="text-right">{cpr.quantity}</TableCell>
                      <TableCell className="text-right font-medium">₹{cpr.total_amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          cpr.payment_status === 'paid' ? 'default' :
                          cpr.payment_status === 'partially_paid' ? 'secondary' : 'outline'
                        }>
                          {cpr.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openCprDialog(cpr)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}