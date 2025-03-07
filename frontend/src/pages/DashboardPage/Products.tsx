import React from 'react';

const Products: React.FC = () => {
  return (
    <div className="bg-card rounded-lg shadow-md p-8 mb-8 text-card-foreground">
      <h2 className="text-lg font-semibold mb-4">Products Management</h2>
      <p className="text-muted-foreground">
        This is a protected admin-only page. You're seeing this because you have the 'admin' role.
      </p>
      <div className="mt-4 p-4 bg-accent/10 rounded-lg">
        <p className="text-sm">
          Implement your admin-only product management features here.
        </p>
      </div>
    </div>
  );
};

export default Products;