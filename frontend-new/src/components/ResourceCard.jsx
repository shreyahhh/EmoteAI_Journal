import React from 'react';

const ResourceCard = ({ resource, onClick }) => (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col items-start hover:bg-gray-700 transition-colors cursor-pointer" onClick={onClick}>
        <div className="text-4xl mb-4">{resource.icon}</div>
        <h3 className="text-xl font-bold text-white mb-2">{resource.title}</h3>
        <p className="text-gray-400 flex-grow">{resource.description}</p>
    </div>
);

export default ResourceCard; 