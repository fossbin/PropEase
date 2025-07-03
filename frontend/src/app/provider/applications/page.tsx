'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface Application {
  id: string;
  status: string;
  message: string;
  bid_amount?: number;
  lease_start?: string;
  lease_end?: string;
  subscription_start?: string;
  subscription_end?: string;
  property_title: string;
  applicant_name: string;
  applicant_id: string;
  created_at: string;
}

interface Document {
  id: string;
  document_type: string;
  document_url: string;
  verified: boolean;
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchApplicationAndDocuments = async () => {
      try {
        // Fetch application details
        const res = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
          headers: {
            'X-User-Id': sessionStorage.getItem('userId') || '',
          },
        });
        const appData = await res.json();
        setApplication(appData);

        // Fetch user documents
        if (appData?.applicant_id) {
          const docRes = await fetch(`${API_BASE_URL}/api/users/${appData.applicant_id}/documents`);
          const docs = await docRes.json();
          setDocuments(docs);
        }
      } catch (err) {
        console.error('Error loading application or documents:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchApplicationAndDocuments();
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

      <Card>
        <CardContent className="space-y-2 p-4">
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

          <p><strong>Message:</strong> {application.message || 'N/A'}</p>

          {application.bid_amount && (
            <p><strong>Bid Amount:</strong> ₹{application.bid_amount.toFixed(2)}</p>
          )}

          {application.lease_start && application.lease_end && (
            <p><strong>Lease Duration:</strong> {format(new Date(application.lease_start), 'dd MMM yyyy')} - {format(new Date(application.lease_end), 'dd MMM yyyy')}</p>
          )}

          {application.subscription_start && application.subscription_end && (
            <>
              <p><strong>Subscription:</strong></p>
              <p><strong>From:</strong> {format(new Date(application.subscription_start), 'dd MMM yyyy')} to {format(new Date(application.subscription_end), 'dd MMM yyyy')}</p>
            </>
          )}

          {documents.length > 0 && (
            <div>
              <strong>Documents:</strong>
              <ul className="list-disc ml-5">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {doc.document_type} {doc.verified ? '(Verified)' : '(Not Verified)'}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p><strong>Submitted on:</strong> {format(new Date(application.created_at), 'dd MMM yyyy')}</p>

          {application.status === 'Pending' && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => handleUpdate('Approved')}
                disabled={updating}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleUpdate('Rejected')}
                disabled={updating}
              >
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
