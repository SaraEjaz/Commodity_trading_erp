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
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getParties,
  createParty,
  updateParty,
  deleteParty,
  getCommodities,
  createCommodity,
  updateCommodity,
  deleteCommodity,
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getCommissionRules,
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule
} from '@/lib/api/masters';

interface Party {
  id: number;
  code: string;
  name: string;
  address: string;
  gst_number: string;
  contact_person: string;
  phone: string;
  email: string;
  party_type: 'buyer' | 'seller' | 'both';
  is_active: boolean;
}

interface Commodity {
  id: number;
  code: string;
  name: string;
  description: string;
  unit: string;
  is_active: boolean;
}

interface BankAccount {
  id: number;
  account_number: string;
  bank_name: string;
  branch_name: string;
  ifsc_code: string;
  account_holder_name: string;
  is_active: boolean;
}

interface CommissionRule {
  id: number;
  commodity: string;
  buyer_commission_rate: number;
  seller_commission_rate: number;
  minimum_quantity: number;
  maximum_quantity: number;
  effective_from: string;
  effective_to: string;
  is_active: boolean;
}

export default function CommissionSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('parties');
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [parties, setParties] = useState<Party[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);

  // Dialog states
  const [partyDialogOpen, setPartyDialogOpen] = useState(false);
  const [commodityDialogOpen, setCommodityDialogOpen] = useState(false);
  const [bankAccountDialogOpen, setBankAccountDialogOpen] = useState(false);
  const [commissionRuleDialogOpen, setCommissionRuleDialogOpen] = useState(false);

  // Form states
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [editingCommodity, setEditingCommodity] = useState<Commodity | null>(null);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [editingCommissionRule, setEditingCommissionRule] = useState<CommissionRule | null>(null);

  // Form data
  const [partyForm, setPartyForm] = useState({
    code: '',
    name: '',
    address: '',
    gst_number: '',
    contact_person: '',
    phone: '',
    email: '',
    party_type: 'buyer' as 'buyer' | 'seller' | 'both',
    is_active: true
  });

  const [commodityForm, setCommodityForm] = useState({
    code: '',
    name: '',
    description: '',
    unit: 'MT',
    is_active: true
  });

  const [bankAccountForm, setBankAccountForm] = useState({
    account_number: '',
    bank_name: '',
    branch_name: '',
    ifsc_code: '',
    account_holder_name: '',
    is_active: true
  });

  const [commissionRuleForm, setCommissionRuleForm] = useState({
    commodity: '',
    buyer_commission_rate: 0,
    seller_commission_rate: 0,
    minimum_quantity: 0,
    maximum_quantity: 0,
    effective_from: '',
    effective_to: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'parties':
          const partiesData = await getParties();
          setParties(partiesData);
          break;
        case 'commodities':
          const commoditiesData = await getCommodities();
          setCommodities(commoditiesData);
          break;
        case 'bank-accounts':
          const bankAccountsData = await getBankAccounts();
          setBankAccounts(bankAccountsData);
          break;
        case 'commission-rules':
          const commissionRulesData = await getCommissionRules();
          setCommissionRules(commissionRulesData);
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

  const handlePartySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingParty) {
        await updateParty(editingParty.id, partyForm);
        toast({ title: 'Success', description: 'Party updated successfully' });
      } else {
        await createParty(partyForm);
        toast({ title: 'Success', description: 'Party created successfully' });
      }
      setPartyDialogOpen(false);
      resetPartyForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save party',
        variant: 'destructive',
      });
    }
  };

  const handleCommoditySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCommodity) {
        await updateCommodity(editingCommodity.id, commodityForm);
        toast({ title: 'Success', description: 'Commodity updated successfully' });
      } else {
        await createCommodity(commodityForm);
        toast({ title: 'Success', description: 'Commodity created successfully' });
      }
      setCommodityDialogOpen(false);
      resetCommodityForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save commodity',
        variant: 'destructive',
      });
    }
  };

  const handleBankAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBankAccount) {
        await updateBankAccount(editingBankAccount.id, bankAccountForm);
        toast({ title: 'Success', description: 'Bank account updated successfully' });
      } else {
        await createBankAccount(bankAccountForm);
        toast({ title: 'Success', description: 'Bank account created successfully' });
      }
      setBankAccountDialogOpen(false);
      resetBankAccountForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save bank account',
        variant: 'destructive',
      });
    }
  };

  const handleCommissionRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCommissionRule) {
        await updateCommissionRule(editingCommissionRule.id, commissionRuleForm);
        toast({ title: 'Success', description: 'Commission rule updated successfully' });
      } else {
        await createCommissionRule(commissionRuleForm);
        toast({ title: 'Success', description: 'Commission rule created successfully' });
      }
      setCommissionRuleDialogOpen(false);
      resetCommissionRuleForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save commission rule',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      switch (type) {
        case 'party':
          await deleteParty(id);
          break;
        case 'commodity':
          await deleteCommodity(id);
          break;
        case 'bank-account':
          await deleteBankAccount(id);
          break;
        case 'commission-rule':
          await deleteCommissionRule(id);
          break;
      }
      toast({ title: 'Success', description: 'Item deleted successfully' });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const resetPartyForm = () => {
    setPartyForm({
      code: '',
      name: '',
      address: '',
      gst_number: '',
      contact_person: '',
      phone: '',
      email: '',
      party_type: 'buyer',
      is_active: true
    });
    setEditingParty(null);
  };

  const resetCommodityForm = () => {
    setCommodityForm({
      code: '',
      name: '',
      description: '',
      unit: 'MT',
      is_active: true
    });
    setEditingCommodity(null);
  };

  const resetBankAccountForm = () => {
    setBankAccountForm({
      account_number: '',
      bank_name: '',
      branch_name: '',
      ifsc_code: '',
      account_holder_name: '',
      is_active: true
    });
    setEditingBankAccount(null);
  };

  const resetCommissionRuleForm = () => {
    setCommissionRuleForm({
      commodity: '',
      buyer_commission_rate: 0,
      seller_commission_rate: 0,
      minimum_quantity: 0,
      maximum_quantity: 0,
      effective_from: '',
      effective_to: '',
      is_active: true
    });
    setEditingCommissionRule(null);
  };

  const openPartyDialog = (party?: Party) => {
    if (party) {
      setEditingParty(party);
      setPartyForm({
        code: party.code,
        name: party.name,
        address: party.address,
        gst_number: party.gst_number,
        contact_person: party.contact_person,
        phone: party.phone,
        email: party.email,
        party_type: party.party_type,
        is_active: party.is_active
      });
    } else {
      resetPartyForm();
    }
    setPartyDialogOpen(true);
  };

  const openCommodityDialog = (commodity?: Commodity) => {
    if (commodity) {
      setEditingCommodity(commodity);
      setCommodityForm({
        code: commodity.code,
        name: commodity.name,
        description: commodity.description,
        unit: commodity.unit,
        is_active: commodity.is_active
      });
    } else {
      resetCommodityForm();
    }
    setCommodityDialogOpen(true);
  };

  const openBankAccountDialog = (bankAccount?: BankAccount) => {
    if (bankAccount) {
      setEditingBankAccount(bankAccount);
      setBankAccountForm({
        account_number: bankAccount.account_number,
        bank_name: bankAccount.bank_name,
        branch_name: bankAccount.branch_name,
        ifsc_code: bankAccount.ifsc_code,
        account_holder_name: bankAccount.account_holder_name,
        is_active: bankAccount.is_active
      });
    } else {
      resetBankAccountForm();
    }
    setBankAccountDialogOpen(true);
  };

  const openCommissionRuleDialog = (commissionRule?: CommissionRule) => {
    if (commissionRule) {
      setEditingCommissionRule(commissionRule);
      setCommissionRuleForm({
        commodity: commissionRule.commodity,
        buyer_commission_rate: commissionRule.buyer_commission_rate,
        seller_commission_rate: commissionRule.seller_commission_rate,
        minimum_quantity: commissionRule.minimum_quantity,
        maximum_quantity: commissionRule.maximum_quantity,
        effective_from: commissionRule.effective_from,
        effective_to: commissionRule.effective_to,
        is_active: commissionRule.is_active
      });
    } else {
      resetCommissionRuleForm();
    }
    setCommissionRuleDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Commission Settings</h1>
          <p className="text-muted-foreground">
            Manage parties, commodities, bank accounts, and commission rules
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="parties">Parties</TabsTrigger>
          <TabsTrigger value="commodities">Commodities</TabsTrigger>
          <TabsTrigger value="bank-accounts">Bank Accounts</TabsTrigger>
          <TabsTrigger value="commission-rules">Commission Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="parties" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Parties</CardTitle>
                <CardDescription>Manage buyers and sellers</CardDescription>
              </div>
              <Dialog open={partyDialogOpen} onOpenChange={setPartyDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openPartyDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Party
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingParty ? 'Edit Party' : 'Add New Party'}</DialogTitle>
                    <DialogDescription>
                      Enter party details below
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePartySubmit}>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div>
                        <Label htmlFor="party-code">Code</Label>
                        <Input
                          id="party-code"
                          value={partyForm.code}
                          onChange={(e) => setPartyForm(prev => ({ ...prev, code: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="party-name">Name</Label>
                        <Input
                          id="party-name"
                          value={partyForm.name}
                          onChange={(e) => setPartyForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="party-address">Address</Label>
                        <Textarea
                          id="party-address"
                          value={partyForm.address}
                          onChange={(e) => setPartyForm(prev => ({ ...prev, address: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="party-gst">GST Number</Label>
                        <Input
                          id="party-gst"
                          value={partyForm.gst_number}
                          onChange={(e) => setPartyForm(prev => ({ ...prev, gst_number: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="party-contact">Contact Person</Label>
                        <Input
                          id="party-contact"
                          value={partyForm.contact_person}
                          onChange={(e) => setPartyForm(prev => ({ ...prev, contact_person: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="party-phone">Phone</Label>
                        <Input
                          id="party-phone"
                          value={partyForm.phone}
                          onChange={(e) => setPartyForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="party-email">Email</Label>
                        <Input
                          id="party-email"
                          type="email"
                          value={partyForm.email}
                          onChange={(e) => setPartyForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="party-type">Party Type</Label>
                        <Select value={partyForm.party_type} onValueChange={(value: 'buyer' | 'seller' | 'both') => setPartyForm(prev => ({ ...prev, party_type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buyer">Buyer</SelectItem>
                            <SelectItem value="seller">Seller</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setPartyDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        {editingParty ? 'Update' : 'Create'}
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
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parties.map((party) => (
                    <TableRow key={party.id}>
                      <TableCell className="font-medium">{party.code}</TableCell>
                      <TableCell>{party.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{party.party_type}</Badge>
                      </TableCell>
                      <TableCell>{party.contact_person}</TableCell>
                      <TableCell>
                        <Badge variant={party.is_active ? 'default' : 'secondary'}>
                          {party.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPartyDialog(party)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete('party', party.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commodities" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Commodities</CardTitle>
                <CardDescription>Manage commodities and their units</CardDescription>
              </div>
              <Dialog open={commodityDialogOpen} onOpenChange={setCommodityDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openCommodityDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Commodity
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCommodity ? 'Edit Commodity' : 'Add New Commodity'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCommoditySubmit}>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="commodity-code">Code</Label>
                        <Input
                          id="commodity-code"
                          value={commodityForm.code}
                          onChange={(e) => setCommodityForm(prev => ({ ...prev, code: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="commodity-name">Name</Label>
                        <Input
                          id="commodity-name"
                          value={commodityForm.name}
                          onChange={(e) => setCommodityForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="commodity-description">Description</Label>
                        <Textarea
                          id="commodity-description"
                          value={commodityForm.description}
                          onChange={(e) => setCommodityForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="commodity-unit">Unit</Label>
                        <Select value={commodityForm.unit} onValueChange={(value) => setCommodityForm(prev => ({ ...prev, unit: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MT">MT (Metric Ton)</SelectItem>
                            <SelectItem value="KG">KG</SelectItem>
                            <SelectItem value="QUINTAL">Quintal</SelectItem>
                            <SelectItem value="BAGS">Bags</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCommodityDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        {editingCommodity ? 'Update' : 'Create'}
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
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commodities.map((commodity) => (
                    <TableRow key={commodity.id}>
                      <TableCell className="font-medium">{commodity.code}</TableCell>
                      <TableCell>{commodity.name}</TableCell>
                      <TableCell>{commodity.unit}</TableCell>
                      <TableCell>
                        <Badge variant={commodity.is_active ? 'default' : 'secondary'}>
                          {commodity.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCommodityDialog(commodity)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete('commodity', commodity.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank-accounts" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bank Accounts</CardTitle>
                <CardDescription>Manage bank accounts for commission settlements</CardDescription>
              </div>
              <Dialog open={bankAccountDialogOpen} onOpenChange={setBankAccountDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openBankAccountDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Bank Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingBankAccount ? 'Edit Bank Account' : 'Add New Bank Account'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleBankAccountSubmit}>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="account-number">Account Number</Label>
                        <Input
                          id="account-number"
                          value={bankAccountForm.account_number}
                          onChange={(e) => setBankAccountForm(prev => ({ ...prev, account_number: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="bank-name">Bank Name</Label>
                        <Input
                          id="bank-name"
                          value={bankAccountForm.bank_name}
                          onChange={(e) => setBankAccountForm(prev => ({ ...prev, bank_name: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="branch-name">Branch Name</Label>
                        <Input
                          id="branch-name"
                          value={bankAccountForm.branch_name}
                          onChange={(e) => setBankAccountForm(prev => ({ ...prev, branch_name: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="ifsc-code">IFSC Code</Label>
                        <Input
                          id="ifsc-code"
                          value={bankAccountForm.ifsc_code}
                          onChange={(e) => setBankAccountForm(prev => ({ ...prev, ifsc_code: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="account-holder">Account Holder Name</Label>
                        <Input
                          id="account-holder"
                          value={bankAccountForm.account_holder_name}
                          onChange={(e) => setBankAccountForm(prev => ({ ...prev, account_holder_name: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setBankAccountDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        {editingBankAccount ? 'Update' : 'Create'}
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
                    <TableHead>Account Number</TableHead>
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>IFSC</TableHead>
                    <TableHead>Account Holder</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.account_number}</TableCell>
                      <TableCell>{account.bank_name}</TableCell>
                      <TableCell>{account.branch_name}</TableCell>
                      <TableCell>{account.ifsc_code}</TableCell>
                      <TableCell>{account.account_holder_name}</TableCell>
                      <TableCell>
                        <Badge variant={account.is_active ? 'default' : 'secondary'}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openBankAccountDialog(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete('bank-account', account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission-rules" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Commission Rules</CardTitle>
                <CardDescription>Manage commission rates for different commodities</CardDescription>
              </div>
              <Dialog open={commissionRuleDialogOpen} onOpenChange={setCommissionRuleDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openCommissionRuleDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Commission Rule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingCommissionRule ? 'Edit Commission Rule' : 'Add New Commission Rule'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCommissionRuleSubmit}>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div>
                        <Label htmlFor="rule-commodity">Commodity</Label>
                        <Select value={commissionRuleForm.commodity} onValueChange={(value) => setCommissionRuleForm(prev => ({ ...prev, commodity: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select commodity" />
                          </SelectTrigger>
                          <SelectContent>
                            {commodities.map((commodity) => (
                              <SelectItem key={commodity.id} value={commodity.code}>
                                {commodity.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="buyer-rate">Buyer Commission Rate (%)</Label>
                        <Input
                          id="buyer-rate"
                          type="number"
                          step="0.01"
                          value={commissionRuleForm.buyer_commission_rate}
                          onChange={(e) => setCommissionRuleForm(prev => ({ ...prev, buyer_commission_rate: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="seller-rate">Seller Commission Rate (%)</Label>
                        <Input
                          id="seller-rate"
                          type="number"
                          step="0.01"
                          value={commissionRuleForm.seller_commission_rate}
                          onChange={(e) => setCommissionRuleForm(prev => ({ ...prev, seller_commission_rate: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="min-quantity">Minimum Quantity</Label>
                        <Input
                          id="min-quantity"
                          type="number"
                          value={commissionRuleForm.minimum_quantity}
                          onChange={(e) => setCommissionRuleForm(prev => ({ ...prev, minimum_quantity: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-quantity">Maximum Quantity</Label>
                        <Input
                          id="max-quantity"
                          type="number"
                          value={commissionRuleForm.maximum_quantity}
                          onChange={(e) => setCommissionRuleForm(prev => ({ ...prev, maximum_quantity: parseFloat(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="effective-from">Effective From</Label>
                        <Input
                          id="effective-from"
                          type="date"
                          value={commissionRuleForm.effective_from}
                          onChange={(e) => setCommissionRuleForm(prev => ({ ...prev, effective_from: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="effective-to">Effective To</Label>
                        <Input
                          id="effective-to"
                          type="date"
                          value={commissionRuleForm.effective_to}
                          onChange={(e) => setCommissionRuleForm(prev => ({ ...prev, effective_to: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCommissionRuleDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        {editingCommissionRule ? 'Update' : 'Create'}
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
                    <TableHead>Commodity</TableHead>
                    <TableHead className="text-right">Buyer Rate (%)</TableHead>
                    <TableHead className="text-right">Seller Rate (%)</TableHead>
                    <TableHead className="text-right">Min Qty</TableHead>
                    <TableHead className="text-right">Max Qty</TableHead>
                    <TableHead>Effective Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.commodity}</TableCell>
                      <TableCell className="text-right">{rule.buyer_commission_rate}%</TableCell>
                      <TableCell className="text-right">{rule.seller_commission_rate}%</TableCell>
                      <TableCell className="text-right">{rule.minimum_quantity}</TableCell>
                      <TableCell className="text-right">{rule.maximum_quantity || 'Unlimited'}</TableCell>
                      <TableCell>
                        {rule.effective_from} to {rule.effective_to || 'Ongoing'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCommissionRuleDialog(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete('commission-rule', rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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