
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addTransaction, formatCurrency } from '@/lib/storage';
import type { Property, UserProperty } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Bath, BedDouble, MapPin, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const allProperties: Property[] = [
  {
    id: 'prop1',
    name: 'Modern Downtown Loft',
    buyPrice: 650000,
    rentPrice: 3500,
    maintenanceFee: 550,
    image: '/houses/house1.jpg',
    location: 'New York, NY',
    bedrooms: 1,
    bathrooms: 1,
    description: 'A stylish loft in the heart of the city, perfect for urban living. Comes fully furnished with modern amenities.',
  },
  {
    id: 'prop2',
    name: 'Suburban Family Home',
    buyPrice: 450000,
    rentPrice: 2800,
    maintenanceFee: 500,
    image: '/houses/house2.jpg',
    location: 'Austin, TX',
    bedrooms: 4,
    bathrooms: 3,
    description: 'Spacious family home with a large backyard, great schools nearby, and a friendly community.',
  },
  {
    id: 'prop3',
    name: 'Luxury Beachfront Villa',
    buyPrice: 2500000,
    rentPrice: 15000,
    maintenanceFee: 3000,
    image: '/houses/house3.jpg',
    location: 'Malibu, CA',
    bedrooms: 5,
    bathrooms: 6,
    description: 'Experience luxury with this stunning beachfront villa offering breathtaking ocean views and private beach access.',
  },
  {
    id: 'prop4',
    name: 'Cozy Studio Apartment',
    buyPrice: 180000,
    rentPrice: 1800,
    maintenanceFee: 300,
    image: '/houses/house4.jpg',
    location: 'Chicago, IL',
    bedrooms: 1,
    bathrooms: 1,
    description: 'A cozy and affordable studio apartment in a vibrant neighborhood, close to public transport and local cafes.',
  },
    {
    id: 'prop5',
    name: 'Mountain View Cabin',
    buyPrice: 320000,
    rentPrice: 2200,
    maintenanceFee: 400,
    image: '/houses/house5.jpg',
    location: 'Denver, CO',
    bedrooms: 3,
    bathrooms: 2,
    description: 'A rustic cabin with stunning mountain views, perfect for nature lovers looking for a peaceful retreat.',
  },
  {
    id: 'prop6',
    name: 'Chic Urban Condo',
    buyPrice: 780000,
    rentPrice: 4200,
    maintenanceFee: 600,
    image: '/houses/house6.jpg',
    location: 'Miami, FL',
    bedrooms: 2,
    bathrooms: 2,
    description: 'A modern condo in a high-rise building with a pool, gym, and incredible city views.',
  },
   {
    id: 'prop7',
    name: 'Historic Townhouse',
    buyPrice: 1200000,
    rentPrice: 6500,
    maintenanceFee: 800,
    image: '/houses/house7.jpg',
    location: 'Boston, MA',
    bedrooms: 4,
    bathrooms: 4,
    description: 'A beautifully preserved historic townhouse in a prestigious neighborhood, blending classic charm with modern updates.',
  },
  {
    id: 'prop8',
    name: 'Desert Oasis',
    buyPrice: 850000,
    rentPrice: 5000,
    maintenanceFee: 700,
    image: '/houses/house8.jpg',
    location: 'Scottsdale, AZ',
    bedrooms: 3,
    bathrooms: 3,
    description: 'A luxurious desert home with a private pool, stunning sunset views, and contemporary architecture.',
  },
];

export default function MyPropertiesPage() {
    const { user, updateUserContext } = useAuth();
    const { toast } = useToast();
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    if (!user) return null;

    const handleSellClick = (userProperty: UserProperty) => {
        const propertyDetails = allProperties.find(p => p.id === userProperty.propertyId);
        if (propertyDetails) {
            setSelectedProperty(propertyDetails);
            setIsConfirmOpen(true);
        }
    };
    
    const handleConfirmSell = async () => {
        if (!user || !selectedProperty) return;

        const updatedUser = { ...user };
        updatedUser.balances.USD += selectedProperty.buyPrice; // Sell at original price for simplicity

        addTransaction(updatedUser, {
            type: 'deposit',
            amount: selectedProperty.buyPrice,
            currency: 'USD',
            description: `Sale of ${selectedProperty.name}`,
        });

        // Remove property and associated recurring expense
        if(!updatedUser.properties) updatedUser.properties = [];
        updatedUser.properties = updatedUser.properties.filter(p => p.propertyId !== selectedProperty.id);

        if(!updatedUser.recurringExpenses) updatedUser.recurringExpenses = [];
        updatedUser.recurringExpenses = updatedUser.recurringExpenses.filter(e => e.propertyId !== selectedProperty.id);
        
        await updateUserContext(updatedUser);
        
        toast({
            title: 'Property Sold!',
            description: `You have sold ${selectedProperty.name} for ${formatCurrency(selectedProperty.buyPrice, 'USD')}.`,
        });

        setIsConfirmOpen(false);
        setSelectedProperty(null);
    }

    const userProperties = (user.properties || []).map(up => {
        return allProperties.find(p => p.id === up.propertyId);
    }).filter(Boolean) as Property[];

    return (
        <main className="p-4 md:p-6 space-y-6">
             <Card className="shadow-lg shadow-primary/5">
                <CardHeader>
                    <CardTitle>My Properties</CardTitle>
                    <CardDescription>Manage the properties you own and rent.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userProperties.length > 0 ? userProperties.map(property => {
                        const userProp = user.properties.find(p => p.propertyId === property.id)!;
                        return (
                            <Card key={property.id} className="overflow-hidden flex flex-col">
                                <div className="relative">
                                    <Image 
                                        src={property.image}
                                        alt={property.name}
                                        width={600}
                                        height={400}
                                        className="object-cover w-full h-48"
                                        data-ai-hint="property house"
                                    />
                                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full capitalize">
                                        {userProp.ownershipType === 'buy' ? 'Owned' : 'Rented'}
                                    </div>
                                </div>
                                <CardHeader>
                                    <CardTitle>{property.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 pt-1">
                                        <MapPin className="h-4 w-4" /> {property.location}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="flex justify-around text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <BedDouble className="h-5 w-5 text-primary" />
                                            <span>{property.bedrooms} Beds</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Bath className="h-5 w-5 text-primary" />
                                            <span>{property.bathrooms} Baths</span>
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-center mt-4 text-primary">
                                        {userProp.ownershipType === 'buy' ? 'Market Value: ' : 'Monthly Rent: '}
                                        {formatCurrency(userProp.ownershipType === 'buy' ? property.buyPrice : property.rentPrice, 'USD')}
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    {userProp.ownershipType === 'buy' ? (
                                        <Button className="w-full" variant="destructive" onClick={() => handleSellClick(userProp)}>
                                            Sell Property
                                        </Button>
                                    ) : (
                                        <Button className="w-full" disabled>
                                            Manage Rental
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    }) : (
                        <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-16">
                            <p>You do not own or rent any properties.</p>
                            <Button variant="link" asChild><a href="/dashboard/housing">Browse marketplace</a></Button>
                        </div>
                    )}
                </CardContent>
             </Card>

              {selectedProperty && (
                 <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Sale</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to sell "{selectedProperty.name}" for {formatCurrency(selectedProperty.buyPrice, 'USD')}? 
                                This amount will be added to your USD balance.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                            <Button onClick={handleConfirmSell} variant="destructive">Confirm Sale</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </main>
    );
}
