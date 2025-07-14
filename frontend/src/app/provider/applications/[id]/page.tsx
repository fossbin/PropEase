'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface Document {
  id: string;
  document_url: string;
  document_type: string;
  verified: boolean;
}

interface PropertyDetails {
  title: string;
  type: string;
  price: number;
  status: string;
  is_negotiable: boolean;
  transaction_type: string;
}

interface Application {
  id: string;
  status: string;
  message?: string;
  bid_amount?: number;
  lease_start?: string;
  lease_end?: string;
  subscription_start?: string;
  subscription_end?: string;
  property_id: string;
  property_title: string;
  applicant_id: string;
  applicant_name: string;
  created_at: string;
}

interface UserProfile {
  name: string;
  phone_number: string;
  email: string;
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const [application, setApplication] = useState<Application | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userDocuments, setUserDocuments] = useState<Document[]>([]);
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
          headers: { 'X-User-Id': sessionStorage.getItem('userId') || '' },
        });
        const data = await res.json();

        setApplication(data.application);
        setUserProfile(data.user_profile);
        setUserDocuments(data.user_documents);
        setPropertyDetails(data.property_details);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchApplication();
  }, [id]);

  const handleUpdate = async (status: 'Approved' | 'Rejected') => {
    setUpdating(true);
    try {
      await fetch(`${API_BASE_URL}/api/applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': sessionStorage.getItem('userId') || '',
        },
        body: JSON.stringify({ status }),
      });
      setApplication((prev) => (prev ? { ...prev, status } : prev));
    } catch (err) {
      console.error('Failed to update application:', err);
      alert('Error updating application');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !application) return <p>Loading application details...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Application to: {application.property_title}</h1>

      {propertyDetails && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <h2 className="text-lg font-semibold">Property Details</h2>
            <p><strong>Type:</strong> {propertyDetails.type}</p>
            <p><strong>Transaction:</strong> {propertyDetails.transaction_type}</p>
            <p><strong>Status:</strong> {propertyDetails.status}</p>
            <p><strong>Price:</strong> ₹{propertyDetails.price.toFixed(2)}</p>
            <p><strong>Negotiable:</strong> {propertyDetails.is_negotiable ? 'Yes' : 'No'}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex justify-between items-center">
            <p><strong>Applicant:</strong> {application.applicant_name}</p>
            <Badge variant={
              application.status === 'Pending'
                ? 'default'
                : application.status === 'Approved'
                ? 'secondary'
                : 'destructive'
            }>
              {application.status}
            </Badge>
          </div>

          {userProfile && (
            <div className="space-y-1">
              <p><strong>Name:</strong> {userProfile.name}</p>
              <p><strong>Email:</strong> {userProfile.email}</p>
              <p><strong>Phone:</strong> {userProfile.phone_number || 'N/A'}</p>
            </div>
          )}

          <p><strong>Message:</strong> {application.message || 'N/A'}</p>

          {application.bid_amount !== undefined && (
            <p><strong>Bid Amount:</strong> ₹{application.bid_amount.toFixed(2)}</p>
          )}

          {application.lease_start && application.lease_end && (
            <p>
              <strong>Lease Duration:</strong>{' '}
              {format(new Date(application.lease_start), 'dd MMM yyyy')} -{' '}
              {format(new Date(application.lease_end), 'dd MMM yyyy')}
            </p>
          )}

          {application.subscription_start && application.subscription_end && (
            <>
              <p><strong>Subscription Period:</strong></p>
              <p>
                <strong>From:</strong>{' '}
                {format(new Date(application.subscription_start), 'dd MMM yyyy')} to{' '}
                {format(new Date(application.subscription_end), 'dd MMM yyyy')}
              </p>
            </>
          )}

          {userDocuments.length > 0 && (
            <div>
              <strong>User Documents:</strong>
              <ul className="list-disc ml-5 space-y-1">
                {userDocuments.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {doc.document_type} {doc.verified ? '(Verified)' : '(Unverified)'}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p><strong>Submitted on:</strong> {format(new Date(application.created_at), 'dd MMM yyyy')}</p>

          {application.status === 'Pending' && (
            <div className="flex gap-2 mt-4">
              <Button onClick={() => handleUpdate('Approved')} disabled={updating}>
                Approve
              </Button>
              <Button variant="destructive" onClick={() => handleUpdate('Rejected')} disabled={updating}>
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
