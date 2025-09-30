import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Grid3X3, 
  List, 
  Filter,
  SortAsc,
  Star,
  Heart,
  Activity
} from 'lucide-react';
import { useGoatContext } from '@/context/GoatContext';
import { Goat } from '@herd-harmony/shared-types/goat';
import GoatCard from './GoatCard';
import InteractiveGoatProfile from './InteractiveGoatProfile';
import GoatForm from './GoatForm';
import { toast } from '@/components/ui/use-toast';
import BreedingForm from '../breeding/BreedingForm';
import { BreedingRecord } from '@herd-harmony/shared-types/breeding';

export default function GoatManagement() {
  const { 
    goats, 
    addGoat, 
    updateGoat, 
    deleteGoat, 
    weightRecords,
    healthRecords,
    addWeightRecord,
    updateWeightRecord,
    deleteWeightRecord,
    addHealthRecord,
    updateHealthRecord,
    deleteHealthRecord,
    breedingRecords,
    addBreedingRecord,
    updateBreedingRecord,
    deleteBreedingRecord,
    loading, 
    error,
    thumbnails,
  } = useGoatContext();

  const [selectedGoat, setSelectedGoat] = useState<Goat | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBreedingFormOpen, setIsBreedingFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterBreed, setFilterBreed] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  
  // Get unique breeds for filter
  const breeds = [...new Set(goats.map(g => g.breed))];
  
  const filteredGoats = goats
    .filter(goat => {
      const matchesSearch = 
        goat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goat.tagNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goat.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goat.gender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goat.status.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || goat.status === filterStatus;
      const matchesGender = filterGender === 'all' || goat.gender === filterGender;
      const matchesBreed = filterBreed === 'all' || goat.breed === filterBreed;
      
      return matchesSearch && matchesStatus && matchesGender && matchesBreed;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'age':
          return new Date(b.birthDate).getTime() - new Date(a.birthDate).getTime();
        case 'weight':
          return (b.currentWeight || 0) - (a.currentWeight || 0);
        case 'tagNumber':
          return a.tagNumber.localeCompare(b.tagNumber);
        case 'favorite':
          return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
        default:
          return 0;
      }
    });

  const handleAddGoat = () => {
    setSelectedGoat(null);
    setIsFormOpen(true);
  };

  const handleEditGoat = (goat: Goat) => {
    setSelectedGoat(goat);
    setIsFormOpen(true);
  };

  const handleViewGoat = (goat: Goat) => {
    setSelectedGoat(goat);
    setIsProfileOpen(true);
  };

  const handleDeleteGoat = async (goat: Goat) => {
    if (window.confirm(`Are you sure you want to delete ${goat.name}? This action cannot be undone.`)) {
      try {
        await deleteGoat(goat.id);
        toast({
          title: "Success",
          description: `${goat.name} has been deleted successfully`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete goat",
          variant: "destructive",
        });
      }
    }
  };

  const handleQuickWeight = (goat: Goat) => {
    toast({
      title: "Quick Weight",
      description: `Opening weight form for ${goat.name}`,
    });
  };

  const handleQuickHealth = (goat: Goat) => {
    toast({
      title: "Quick Health",
      description: `Opening health form for ${goat.name}`,
    });
  };

  const handleQuickBreeding = (goat: Goat) => {
    setSelectedGoat(goat);
    setIsBreedingFormOpen(true);
  };

  const handleToggleFavorite = async (goat: Goat) => {
    try {
      await updateGoat(goat.id, { isFavorite: !goat.isFavorite });
      toast({
        title: "Success",
        description: `${goat.name} ${goat.isFavorite ? 'removed from' : 'added to'} favorites`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const handleSubmitGoat = async (goatData: Partial<Goat>) => {
    try {
      if (selectedGoat) {
        await updateGoat(selectedGoat.id, goatData);
        toast({
          title: "Success",
          description: "Goat updated successfully",
        });
      } else {
        await addGoat(goatData);
        toast({
          title: "Success",
          description: "Goat added successfully",
        });
      }
      setIsFormOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: selectedGoat ? "Failed to update goat" : "Failed to add goat",
        variant: "destructive",
      });
    }
  };

  const handleSubmitBreeding = async (breedingData: BreedingRecord) => {
    try {
      await addBreedingRecord(breedingData);
      toast({
        title: "Success",
        description: "Breeding record added successfully",
      });
      setIsBreedingFormOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add breeding record",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">Loading goats...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-destructive">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  const favoriteGoats = goats.filter(g => g.isFavorite);
  const activeGoats = goats.filter(g => g.status === 'active');
  const pregnantGoats = goats.filter(g => g.breedingStatus === 'pregnant');
  const does = goats.filter(g => g.gender === 'female' && g.status === 'active');
  const bucks = goats.filter(g => g.gender === 'male' && g.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Goat Management</h1>
          <p className="text-muted-foreground">
            Ultra-productive herd management with visual storytelling
          </p>
        </div>
        <Button onClick={handleAddGoat} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Goat
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-primary">{activeGoats.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Active Goats</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-primary">{favoriteGoats.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Favorites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-primary">{pregnantGoats.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Pregnant</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <span className="text-2xl font-bold text-primary">{breeds.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Breeds</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, tag, breed ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="deceased">Deceased</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBreed} onValueChange={setFilterBreed}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Breed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Breeds</SelectItem>
                  {breeds.map(breed => (
                    <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="age">Age</SelectItem>
                  <SelectItem value="weight">Weight</SelectItem>
                  <SelectItem value="tagNumber">Tag #</SelectItem>
                  <SelectItem value="favorite">Favorites</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="border-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="border-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>Showing {filteredGoats.length} of {goats.length} goats</span>
            {(searchTerm || filterStatus !== 'all' || filterGender !== 'all' || filterBreed !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterGender('all');
                  setFilterBreed('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Goats Grid/List */}
      {filteredGoats.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
        }>
          {filteredGoats.map((goat) => (
            <GoatCard
              key={goat.id}
              goat={goat}
              onView={handleViewGoat}
              onEdit={handleEditGoat}
              onDelete={handleDeleteGoat}
              onQuickWeight={handleQuickWeight}
              onQuickHealth={handleQuickHealth}
              onQuickBreeding={handleQuickBreeding}
              onToggleFavorite={handleToggleFavorite}
              viewMode={viewMode}
              thumbnail={thumbnails.find(t => t.goatId === goat.id)?.thumbnailUrl}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || filterStatus !== 'all' || filterGender !== 'all' || filterBreed !== 'all'
                ? 'No goats match your criteria'
                : 'No goats in your herd yet'
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterStatus !== 'all' || filterGender !== 'all' || filterBreed !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Add your first goat to start building your digital herd'
              }
            </p>
            {(!searchTerm && filterStatus === 'all' && filterGender === 'all' && filterBreed === 'all') && (
              <Button onClick={handleAddGoat}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Goat
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <GoatForm
        goat={selectedGoat}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitGoat}
      />

      {isBreedingFormOpen && (
        <BreedingForm
          does={does}
          bucks={bucks}
          onSubmit={handleSubmitBreeding}
          onCancel={() => setIsBreedingFormOpen(false)}
        />
      )}

      <InteractiveGoatProfile
        goat={selectedGoat}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onEdit={handleEditGoat}
        weightRecords={weightRecords}
        healthRecords={healthRecords}
        onAddWeight={addWeightRecord}
        onUpdateWeight={updateWeightRecord}
        onDeleteWeight={deleteWeightRecord}
        onAddHealthRecord={addHealthRecord}
        onUpdateHealthRecord={updateHealthRecord}
        onDeleteHealthRecord={deleteHealthRecord}
        allGoats={goats}
        breedingRecords={breedingRecords}
        onAddBreeding={addBreedingRecord}
        onUpdateBreeding={updateBreedingRecord}
        onDeleteBreeding={deleteBreedingRecord}
        thumbnailUrl={thumbnails.find(t => t.goatId === selectedGoat?.id)?.thumbnailUrl}
      />
    </div>
  );
}

