import { UserInfo } from '@/KeycloakProvider';

interface UserInfoCardProps {
  user: UserInfo | null;
}

export const UserInfoCard = ({ user }: UserInfoCardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <h3 className="font-semibold mb-4">User Information</h3>
      <dl className="space-y-2">
        <div className="grid grid-cols-2">
          <dt className="text-sm font-medium text-muted-foreground">Username:</dt>
          <dd className="text-sm">{user?.username || 'N/A'}</dd>
        </div>
        <div className="grid grid-cols-2">
          <dt className="text-sm font-medium text-muted-foreground">Email:</dt>
          <dd className="text-sm">{user?.email || 'N/A'}</dd>
        </div>
        <div className="grid grid-cols-2">
          <dt className="text-sm font-medium text-muted-foreground">Full Name:</dt>
          <dd className="text-sm">
            {(user?.firstName && user?.lastName) 
              ? `${user.firstName} ${user.lastName}` 
              : 'N/A'}
          </dd>
        </div>
        <div className="grid grid-cols-2">
          <dt className="text-sm font-medium text-muted-foreground">User ID:</dt>
          <dd className="text-xs font-mono truncate">{user?.id || 'N/A'}</dd>
        </div>
      </dl>
    </div>
  );
};