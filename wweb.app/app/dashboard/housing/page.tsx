
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addTransaction, formatCurrency, updateUser, getUserByAccountNumber } from '@/lib/storage';
import type { Property } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Bath, BedDouble, MapPin, DollarSign, Percent } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { addYears } from 'date-fns';
import { useTime } from '@/hooks/use-time';
import { db } from '@/lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';

export const allProperties: Property[] = [
  {
    id: 'prop1',
    name: 'Modern Downtown Loft',
    buyPrice: 650000,
    rentPrice: 3500,
    maintenanceFee: 550,
    image: 'https://picsum.photos/seed/prop1/600/400',
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
    image: 'https://picsum.photos/seed/prop2/600/400',
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
    image: 'https://picsum.photos/seed/prop3/600/400',
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
    image: 'https://picsum.photos/seed/prop4/600/400',
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
    image: 'https://picsum.photos/seed/prop5/600/400',
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
    image: 'https://picsum.photos/seed/prop6/600/400',
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
    image: 'https://picsum.photos/seed/prop7/600/400',
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
    image: 'https://picsum.photos/seed/prop8/600/400',
    location: 'Scottsdale, AZ',
    bedrooms: 3,
    bathrooms: 3,
    description: 'A luxurious desert home with a private pool, stunning sunset views, and contemporary architecture.',
  },
];


const HOUSING_TAX_RATE = 0.10; // 10%

async function addFeeToAdmin(feeAmount: number, description: string) {
    const adminRef = doc(db, "users", 'admin-user-id');
    try {
        await runTransaction(db, async (transaction) => {
            const adminDoc = await transaction.get(adminRef);
            if (!adminDoc.exists()) {
                throw "Admin user does not exist!";
            }
            const adminData = adminDoc.data() as User;
            const newFeesCollected = (adminData.feesCollected || 0) + feeAmount;
            transaction.update(adminRef, { feesCollected: newFeesCollected });
        });
    } catch (e) {
        console.error("Admin fee transaction failed: ", e);
    }
}


export default function HousingPage() {
    const { user, updateUserContext } = useAuth();
    const { currentDate } = useTime();
    const { toast } = useToast();
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [actionType, setActionType] = useState<'buy' | 'rent' | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleActionClick = (property: Property, type: 'buy' | 'rent') => {
        setSelectedProperty(property);
        setActionType(type);
        setIsConfirmOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!user || !selectedProperty || !actionType) return;

        const isAlreadyAcquired = (user.properties || []).some(p => p.propertyId === selectedProperty.id);
        if (isAlreadyAcquired) {
            toast({
                variant: 'destructive',
                title: 'Already Acquired',
                description: `You already own or rent this property.`,
            });
            setIsConfirmOpen(false);
            return;
        }

        const price = actionType === 'buy' ? selectedProperty.buyPrice : selectedProperty.rentPrice;
        const tax = price * HOUSING_TAX_RATE;
        const totalCost = price + tax;

        if (user.balances.USD < totalCost) {
            toast({
                variant: 'destructive',
                title: 'Insufficient Funds',
                description: `You need ${formatCurrency(totalCost, 'USD')} (including tax) to ${actionType} this property.`,
            });
            setIsConfirmOpen(false);
            return;
        }

        const updatedUser = { ...user };
        updatedUser.balances.USD -= totalCost;

        addTransaction(updatedUser, {
            type: 'expense',
            amount: price,
            currency: 'USD',
            description: `${actionType === 'buy' ? 'Purchase of' : 'Initial rent for'} ${selectedProperty.name}`,
            category: 'Housing',
        });
        
        addTransaction(updatedUser, {
            type: 'fee',
            amount: tax,
            currency: 'USD',
            description: `10% VAT for ${selectedProperty.name}`,
        });
        
        await addFeeToAdmin(tax, `10% housing VAT from ${user.username} for ${selectedProperty.name}`);
        
        // Add property to user's list
        if (!updatedUser.properties) updatedUser.properties = [];
        updatedUser.properties.push({
            propertyId: selectedProperty.id,
            ownershipType: actionType,
            purchaseDate: currentDate.toISOString(),
        });
        
        // Add recurring expense for rent or maintenance
        if (!updatedUser.recurringExpenses) updatedUser.recurringExpenses = [];
        
        const fee = actionType === 'buy' ? selectedProperty.maintenanceFee : selectedProperty.rentPrice;
        const feeType = actionType === 'buy' ? 'Maintenance' : 'Rent';
        const nextDueDate = actionType === 'buy' 
            ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1) 
            : addYears(currentDate, 1);
        
        if (fee > 0) {
             updatedUser.recurringExpenses.push({
                id: crypto.randomUUID(),
                name: `${feeType} for ${selectedProperty.name}`,
                amount: fee,
                currency: 'USD',
                category: 'Housing',
                nextDueDate: nextDueDate.toISOString(),
                interval: actionType === 'buy' ? 'monthly' : 'annually',
                propertyId: selectedProperty.id,
            });
        }


        await updateUserContext(updatedUser);

        toast({
            title: 'Success!',
            description: `You have successfully ${actionType === 'buy' ? 'purchased' : 'rented'} ${selectedProperty.name}.`,
        });

        setIsConfirmOpen(false);
        setSelectedProperty(null);
    };

    const userPropertyIds = user?.properties?.map(p => p.propertyId) || [];

    return (
        <main className="p-4 md:p-6 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Real Estate Marketplace</CardTitle>
                    <CardDescription>Find your next home. Browse properties for sale or for rent.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {allProperties.map(property => {
                        const isAcquired = userPropertyIds.includes(property.id);
                        return (
                            <Card key={property.id} className="overflow-hidden flex flex-col">
                                <div className="relative">
                                    <Image 
                                        src={property.image}
                                        alt={property.name}
                                        width={600}
                                        height={400}
                                        className="object-cover w-full h-48"
                                        data-ai-hint="modern house"
                                    />
                                    {isAcquired && (
                                         <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full capitalize">
                                            Acquired
                                        </div>
                                    )}
                                </div>
                                <CardHeader>
                                    <CardTitle>{property.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 pt-1">
                                        <MapPin className="h-4 w-4" /> {property.location}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4">
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
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div>
                                            <p className="text-xl font-bold text-primary">
                                                {formatCurrency(property.buyPrice, 'USD')}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Buy Price</p>
                                        </div>
                                         <div>
                                            <p className="text-xl font-bold text-primary">
                                                {formatCurrency(property.rentPrice, 'USD')}
                                                <span className="text-base font-normal text-muted-foreground">/month</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">Rent Price</p>
                                        </div>
                                    </div>
                                     <p className="text-xs text-center text-muted-foreground pt-2">
                                        A 10% VAT applies to all purchases and initial rent payments. Maintenance is charged monthly for owned properties. Rent is billed annually.
                                    </p>
                                </CardContent>
                                <CardFooter className="grid grid-cols-2 gap-2">
                                    <Button className="w-full" onClick={() => handleActionClick(property, 'rent')} disabled={isAcquired}>
                                        Rent Now
                                    </Button>
                                    <Button className="w-full" onClick={() => handleActionClick(property, 'buy')} disabled={isAcquired}>
                                        Buy Now
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </CardContent>
             </Card>

            {selectedProperty && actionType && (
                 <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm {actionType === 'buy' ? 'Purchase' : 'Rental'}</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to {actionType} "{selectedProperty.name}"?
                                <div className="mt-4 space-y-1 text-sm text-foreground">
                                    <div className="flex justify-between"><span>Price:</span> <span>{formatCurrency(actionType === 'buy' ? selectedProperty.buyPrice : selectedProperty.rentPrice, 'USD')}</span></div>
                                    <div className="flex justify-between"><span>10% VAT:</span> <span>{formatCurrency((actionType === 'buy' ? selectedProperty.buyPrice : selectedProperty.rentPrice) * HOUSING_TAX_RATE, 'USD')}</span></div>
                                    <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Total Cost:</span> <span>{formatCurrency((actionType === 'buy' ? selectedProperty.buyPrice : selectedProperty.rentPrice) * (1 + HOUSING_TAX_RATE), 'USD')}</span></div>
                                </div>
                                <p className="text-xs mt-4 text-muted-foreground">This amount will be deducted from your USD balance.</p>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                            <Button onClick={handleConfirmAction}>Confirm</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </main>
    );
}
