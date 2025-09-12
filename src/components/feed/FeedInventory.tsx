/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area"
import { Feed } from '@/types/goat';
import { Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';

interface FeedInventoryProps {
  feeds: Feed[];
  onAddFeed: (feed: Omit<Feed, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateFeed: (id: string, updates: Partial<Feed>) => void;
  onDeleteFeed: (id: string) => void;
}

export default function FeedInventory({ 
  feeds, 
  onAddFeed, 
  onUpdateFeed, 
  onDeleteFeed 
}: FeedInventoryProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFeed, setNewFeed] = useState<Omit<Feed, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    type: 'hay',
    costPerKg: 0,
    stockKg: 0,
    supplier: '',
    expiryDate: undefined,
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [editFeed, setEditFeed] = useState<Partial<Feed>>({});

  const handleAddFeed = () => {
    onAddFeed(newFeed);
    setNewFeed({ name: '', type: 'hay', costPerKg: 0, stockKg: 0, supplier: '', expiryDate: undefined });
    setIsAddDialogOpen(false);
  };

  const handleEditFeed = (id: string) => {
    const feedToEdit = feeds.find(feed => feed.id === id);
    if (feedToEdit) {
      setSelectedFeedId(id);
      setEditFeed(feedToEdit);
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateFeed = () => {
    if (selectedFeedId) {
      onUpdateFeed(selectedFeedId, editFeed);
      setIsEditDialogOpen(false);
      setSelectedFeedId(null);
      setEditFeed({});
    }
  };

  const handleDeleteFeed = (id: string) => {
    onDeleteFeed(id);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Feed Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button onClick={() => setIsAddDialogOpen(true)}>Add Feed</Button>
        </div>
        <ScrollArea>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Cost/Kg</TableHead>
                <TableHead>Stock (Kg)</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeds.map((feed) => (
                <TableRow key={feed.id}>
                  <TableCell>{feed.name}</TableCell>
                  <TableCell>{feed.type}</TableCell>
                  <TableCell>${feed.costPerKg.toFixed(2)}</TableCell>
                  <TableCell>{feed.stockKg}</TableCell>
                  <TableCell>{feed.supplier}</TableCell>
                  <TableCell>
                    {feed.expiryDate ? format(new Date(feed.expiryDate), 'yyyy-MM-dd') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditFeed(feed.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteFeed(feed.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Add Feed Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Feed</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newFeed.name}
                  onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <select
                  id="type"
                  value={newFeed.type}
                  onChange={(e) => setNewFeed({ ...newFeed, type: e.target.value as any })}
                  className="col-span-3 rounded-md border-gray-200 shadow-sm focus:border-primary focus:ring-primary"
                >
                  <option value="hay">Hay</option>
                  <option value="grain">Grain</option>
                  <option value="supplement">Supplement</option>
                  <option value="pellet">Pellet</option>
                  <option value="mineral">Mineral</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="costPerKg" className="text-right">
                  Cost/Kg
                </Label>
                <Input
                  type="number"
                  id="costPerKg"
                  value={newFeed.costPerKg}
                  onChange={(e) => setNewFeed({ ...newFeed, costPerKg: parseFloat(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stockKg" className="text-right">
                  Stock (Kg)
                </Label>
                <Input
                  type="number"
                  id="stockKg"
                  value={newFeed.stockKg}
                  onChange={(e) => setNewFeed({ ...newFeed, stockKg: parseFloat(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier" className="text-right">
                  Supplier
                </Label>
                <Input
                  id="supplier"
                  value={newFeed.supplier}
                  onChange={(e) => setNewFeed({ ...newFeed, supplier: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiryDate" className="text-right">
                  Expiry Date
                </Label>
                <Input
                  type="date"
                  id="expiryDate"
                  value={newFeed.expiryDate ? format(new Date(newFeed.expiryDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setNewFeed({ ...newFeed, expiryDate: new Date(e.target.value) })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleAddFeed}>
                Add Feed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Feed Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Feed</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editName" className="text-right">
                  Name
                </Label>
                <Input
                  id="editName"
                  value={editFeed.name || ''}
                  onChange={(e) => setEditFeed({ ...editFeed, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editType" className="text-right">
                  Type
                </Label>
                <select
                  id="editType"
                  value={editFeed.type || 'hay'}
                  onChange={(e) => setEditFeed({ ...editFeed, type: e.target.value as any })}
                  className="col-span-3 rounded-md border-gray-200 shadow-sm focus:border-primary focus:ring-primary"
                >
                  <option value="grass">Grass</option>
                  <option value="hay">Hay</option>
                  <option value="grain">Grain</option>
                  <option value="supplement">Supplement</option>
                  <option value="pellet">Pellet</option>
                  <option value="mineral">Mineral</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editCostPerKg" className="text-right">
                  Cost/Kg
                </Label>
                <Input
                  type="number"
                  id="editCostPerKg"
                  value={editFeed.costPerKg || 0}
                  onChange={(e) => setEditFeed({ ...editFeed, costPerKg: parseFloat(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editStockKg" className="text-right">
                  Stock (Kg)
                </Label>
                <Input
                  type="number"
                  id="editStockKg"
                  value={editFeed.stockKg || 0}
                  onChange={(e) => setEditFeed({ ...editFeed, stockKg: parseFloat(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editSupplier" className="text-right">
                  Supplier
                </Label>
                <Input
                  id="editSupplier"
                  value={editFeed.supplier || ''}
                  onChange={(e) => setEditFeed({ ...editFeed, supplier: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editExpiryDate" className="text-right">
                  Expiry Date
                </Label>
                <Input
                  type="date"
                  id="editExpiryDate"
                  value={editFeed.expiryDate ? format(new Date(editFeed.expiryDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setEditFeed({ ...editFeed, expiryDate: new Date(e.target.value) })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleUpdateFeed}>
                Update Feed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
