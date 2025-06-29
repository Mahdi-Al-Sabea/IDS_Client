import React from 'react';
import CreateFeature from '../../items/Admin/Features/CreateFeature';
import FeaturesTable from '../../items/Admin/Features/FeaturesTable';

export default function Features() {
  return (
    <div className="container mt-5">
      <h1>Features Page</h1>
      <p>This is the features page where you can manage your features.</p>
      <CreateFeature />
      <FeaturesTable />
      {/* Add more content or components as needed */}
    </div>
  );
}