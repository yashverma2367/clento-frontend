'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Pause, Play, BarChart3, Trash2, Loader2, PlayIcon, PauseIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { makeAuthenticatedRequest } from '../../../lib/axios-utils';
import { Campaign, CampaignStatus } from '../../../types/campaign';
import { toast } from 'sonner';

interface ICampaign extends Campaign {
    list_data: {
        total: number;
        name: string;
    };
    senderData: {
        name: string;
        profile_picture_url?: string;
        status: string;
        provider: string;
    };
    workflowStatus: {
        isRunning: boolean;
        isPaused?: boolean;
        status?: string;
    };
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'IN_PROGRESS':
            return <Badge className="bg-success text-black glow-green">Active</Badge>;
        case 'DRAFT':
            return <Badge variant="secondary">Draft</Badge>;
        case 'COMPLETED':
            return <Badge className="bg-blue-500 text-white">Completed</Badge>;
        case 'PAUSED':
            return <Badge className="bg-warning text-black">Paused</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export default function CampaignsPage() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string[]>([]);
    const { getToken } = useAuth();

    const handleDeleteCampaign = async (campaignId: string) => {
        const token = await getToken();
        setIsDeleting(prev => [...prev, campaignId]);
        if (!token) {
            throw new Error('Authentication required');
        }
        try {
            await makeAuthenticatedRequest('POST', `/campaigns/delete`, { campaignId }, token);
            toast.success('Campaign deleted successfully');
            setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
        } catch (error) {
            toast.error('Failed to delete campaign');
            console.error(error);
        } finally {
            setIsDeleting(prev => prev.filter(id => id !== campaignId));
        }
    };
    const handleEditCampaign = async (campaignId: string) => {
        router.push(`/campaigns/edit/${campaignId}`);
    };

    const handleStart = async (campaignId: string) => {
        const token = await getToken();
        if (!token) {
            throw new Error('Authentication required');
        }
        const reqBody = {
            campaignId,
        };
        try {
            const res = await makeAuthenticatedRequest('POST', '/campaigns/start', reqBody, token);
            toast.success('Campaign Started');
            await fetchCampaigns();
        } catch (error) {
            console.log(error);
        }
    };
    const handlePause = async (campaignId: string) => {
        const token = await getToken();
        if (!token) {
            throw new Error('Authentication required');
        }
        const reqBody = {
            campaignId,
        };
        try {
            const res = await makeAuthenticatedRequest('POST', '/campaigns/pause', reqBody, token);

            toast.success('Campaign Paused');
            await fetchCampaigns();
        } catch (error) {
            console.log(error);
        }
    };
    const handleResume = async (campaignId: string) => {
        const token = await getToken();
        if (!token) {
            throw new Error('Authentication required');
        }
        const reqBody = {
            campaignId,
        };
        try {
            const res = await makeAuthenticatedRequest('POST', '/campaigns/resume', reqBody, token);
            toast.success('Campaign Resumed');
            await fetchCampaigns();
        } catch (error) {
            console.log(error);
        }
    };

    const handlePauseOrPlay = async (campaignId: string) => {
        const campaign = campaigns.find(it => it.id === campaignId);

        if (campaign?.status === CampaignStatus.COMPLETED) {
            toast.error('Campaign is completed');
            return;
        }

        if (campaign?.workflowStatus?.isPaused) {
            await handleResume(campaignId);
            return;
        }

        if (campaign?.status === CampaignStatus.IN_PROGRESS) {
            await handlePause(campaignId);
            return;
        }

        await handleStart(campaignId);
    };

    const fetchCampaigns = async () => {
        setIsLoading(true);
        const token = await getToken();
        if (!token) {
            throw new Error('Authentication required');
        }
        try {
            const res = await makeAuthenticatedRequest('GET', '/campaigns', {}, token);
            setCampaigns(res?.campaigns);
        } catch (error) {
            toast.error('Failed to fetch campaigns');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchCampaigns();
    }, []);
    return (
        <div className="space-y-4">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Campaigns</h1>
                    <p className="text-sm text-muted-foreground">Manage and monitor your outreach campaigns</p>
                </div>
                <Button className="bg-gradient-purple hover-glow-purple text-sm" onClick={() => router.push('/campaigns/create-campaign')}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create Campaign
                </Button>
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 bg-card border border-border/50 rounded-lg">
                <CardTitle className="text-sm text-card-foreground whitespace-nowrap">All Campaigns</CardTitle>
            </div>
            {/* Campaigns Table */}
            <Card className="bg-card border-border/50 h-[63vh] overflow-y-auto">
                <CardContent>
                    {isLoading ? (
                        // Loading State
                        <div className="space-y-3">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Loading campaigns...</span>
                            </div>
                            <div className="space-y-2.5">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-3">
                                        <Skeleton className="h-4 w-[180px]" />
                                        <Skeleton className="h-4 w-[72px]" />
                                        <Skeleton className="h-4 w-[108px]" />
                                        <Skeleton className="h-4 w-[90px]" />
                                        <Skeleton className="h-4 w-[54px]" />
                                        <Skeleton className="h-4 w-[72px]" />
                                        <Skeleton className="h-4 w-[108px]" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : !campaigns || campaigns.length === 0 ? (
                        // No Campaigns State
                        <div className="text-center py-9">
                            <div className="text-sm text-muted-foreground mb-2.5">Oops no campaigns found, create one</div>
                            <Button className="bg-gradient-purple hover-glow-purple text-sm" onClick={() => router.push('/campaigns/create-campaign')}>
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                Create Your First Campaign
                            </Button>
                        </div>
                    ) : (
                        // Campaigns Table
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Campaign Name</TableHead>
                                    <TableHead>Sender Account</TableHead>
                                    <TableHead>Prospect List</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.map(campaign => (
                                    <TableRow key={campaign.id} className="hover:bg-background/50">
                                        <TableCell>
                                            <div>
                                                <div className="font-medium text-foreground">{campaign.name}</div>
                                                <div className="text-xs text-muted-foreground">Created {new Date(campaign.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </TableCell>
                                        {/* <TableCell>{getStatusBadge(campaign.status)}</TableCell> */}
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 bg-muted rounded-md px-2.5 py-1.5 w-fit min-w-[144px]">
                                                {campaign.senderData?.profile_picture_url ? (
                                                    <img src={campaign.senderData.profile_picture_url} alt={campaign.senderData.name || 'Sender'} className="w-7 h-7 rounded-full object-cover border border-border" />
                                                ) : (
                                                    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                                        {campaign.senderData?.name
                                                            ? campaign.senderData.name
                                                                  .split(' ')
                                                                  .map((n: string) => n[0])
                                                                  .join('')
                                                                  .toUpperCase()
                                                            : '?'}
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-xs text-foreground">{campaign.senderData?.name || 'Unknown'}</span>
                                                    <span className="text-xs text-muted-foreground">{campaign.senderData?.provider || 'No provider'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {campaign?.list_data?.name}: {campaign?.list_data?.total} Leads
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => handlePauseOrPlay(campaign.id)}>
                                                    {campaign?.status === CampaignStatus.IN_PROGRESS ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
                                                </Button>
                                                <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => handleEditCampaign(campaign.id)}>
                                                    <Edit className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-error hover:text-error cursor-pointer" onClick={() => handleDeleteCampaign(campaign.id)} disabled={isDeleting.includes(campaign.id)}>
                                                    {isDeleting.includes(campaign.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
        </div>
    );
}
