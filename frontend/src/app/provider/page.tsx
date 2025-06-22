export default function ProviderDashboardHome() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-center">Welcome to Your Provider Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-semibold text-lg mb-2">Add New Property</h2>
          <p className="text-sm text-gray-600">List a new property for lease, PG, or sale.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-semibold text-lg mb-2">My Properties</h2>
          <p className="text-sm text-gray-600">Edit or check the status of your listed properties.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-semibold text-lg mb-2">Applications</h2>
          <p className="text-sm text-gray-600">Review and respond to rental or PG requests.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-semibold text-lg mb-2">Maintenance</h2>
          <p className="text-sm text-gray-600">Handle maintenance tickets for active rentals.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-semibold text-lg mb-2">Analytics</h2>
          <p className="text-sm text-gray-600">Get insights on performance, income, and activity.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-semibold text-lg mb-2">Account & Support</h2>
          <p className="text-sm text-gray-600">Access your account, balance, and support history.</p>
        </div>
      </div>
    </div>
  );
}
