import React from 'react';

const ResourceCard = ({ resource, onClick }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-start hover:bg-orange-100 transition-colors cursor-pointer" onClick={onClick}>
        <div className="text-4xl mb-4">{resource.icon}</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{resource.title}</h3>
        <p className="text-gray-600 flex-grow">{resource.description}</p>
    </div>
);

export default ResourceCard; 