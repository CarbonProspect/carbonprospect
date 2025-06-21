import React from 'react';

function GasesPage() {
  const greenhouseGases = [
    {
      id: 'co2',
      name: 'Carbon Dioxide (CO2)',
      gwp: 1,
      description: 'The primary greenhouse gas emitted through human activities, mainly from burning fossil fuels.',
      sources: ['Fossil fuel combustion', 'Deforestation', 'Industrial processes']
    },
    {
      id: 'ch4',
      name: 'Methane (CH4)',
      gwp: 28,
      description: 'A potent greenhouse gas with 28 times the global warming potential of CO2 over a 100-year period.',
      sources: ['Natural gas systems', 'Livestock', 'Landfills', 'Rice cultivation']
    },
    {
      id: 'n2o',
      name: 'Nitrous Oxide (N2O)',
      gwp: 265,
      description: 'Has 265 times the global warming potential of CO2 over a 100-year period.',
      sources: ['Agricultural soil management', 'Fossil fuel combustion', 'Industrial processes']
    },
    {
      id: 'fgases',
      name: 'Fluorinated Gases',
      gwp: '1,000-23,000',
      description: 'Synthetic gases with extremely high global warming potentials.',
      sources: ['Refrigeration', 'Air conditioning', 'Electronics manufacturing']
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Greenhouse Gases</h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-500">
          Greenhouse gases trap heat in the Earth's atmosphere, contributing to global warming and climate change. 
          Each gas has a different Global Warming Potential (GWP), which measures how much heat it can trap compared to CO2.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {greenhouseGases.map(gas => (
          <div key={gas.id} className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">{gas.name}</h2>
            </div>
            <div className="px-6 py-5">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">Global Warming Potential (GWP)</h3>
                <p className="mt-1 text-lg font-semibold text-green-700">{gas.gwp}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-base text-gray-700">{gas.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Main Sources:</h3>
                <ul className="list-disc ml-5 text-gray-700">
                  {gas.sources.map((source, index) => (
                    <li key={index} className="text-base">{source}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Understanding GWP</h2>
        <p className="text-base text-gray-700 mb-4">
          Global Warming Potential (GWP) is a measure of how much energy the emissions of 1 ton of a gas will absorb over a given period of time, 
          relative to the emissions of 1 ton of carbon dioxide (CO2). The larger the GWP, the more that a given gas warms the Earth compared to CO2 
          over that time period.
        </p>
        <p className="text-base text-gray-700">
          GWP values allow for comparisons of the global warming impacts of different gases. Specifically, 
          it is a measure of how much energy the emissions of 1 ton of a gas will absorb over a given period of time, 
          relative to the emissions of 1 ton of carbon dioxide (CO2).
        </p>
      </div>
    </div>
  );
}

export default GasesPage;