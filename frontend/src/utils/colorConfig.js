export const colorOptions = [
  {
    id: 1,
    name: "Orange",
    hex: "#F97316",        
    lightClass: "bg-orange-500",
    darkClass: "bg-orange-800" 
  },
  {
    id: 2,
    name: "Blue",
    hex: "#3B82F6",     
    lightClass: "bg-blue-500",
    darkClass: "bg-blue-800"   
  },
  {
    id: 3,
    name: "Green",
    hex: "#22C55E",       
    lightClass: "bg-green-500",
    darkClass: "bg-green-800"  
  },
  {
    id: 4,
    name: "Purple",
    hex: "#A855F7",      
    lightClass: "bg-purple-500",
    darkClass: "bg-purple-800"  
  },
  {
    id: 5,
    name: "Yellow",
    hex: "#EAB308",      
    lightClass: "bg-yellow-500",
    darkClass: "bg-yellow-800" 
  },
  {
    id: 6,
    name: "Pink",
    hex: "#EC4899",       
    lightClass: "bg-pink-500",
    darkClass: "bg-pink-800"   
  },
  {
    id: 7,
    name: "Red",
    hex: "#EF4444",      
    lightClass: "bg-red-500",
    darkClass: "bg-red-800"    
  },
  {
    id: 8,
    name: "Indigo",
    hex: "#6366F1",       
    lightClass: "bg-indigo-500",
    darkClass: "bg-indigo-800"  
  },
  {
    id: 9,
    name: "Teal",
    hex: "#14B8A6",       
    lightClass: "bg-teal-500",
    darkClass: "bg-teal-800"    
  },
  {
    id: 10,
    name: "Cyan",
    hex: "#06B6D4",      
    lightClass: "bg-cyan-500",
    darkClass: "bg-cyan-800"   
  },
  {
    id: 11,
    name: "Lime",
    hex: "#84CC16",      
    lightClass: "bg-lime-500",
    darkClass: "bg-lime-800"    
  },
  {
    id: 12,
    name: "Rose",
    hex: "#F43F5E",     
    lightClass: "bg-rose-500",
    darkClass: "bg-rose-800"   
  },
  {
    id: 13,
    name: "Amber",
    hex: "#F59E0B",       
    lightClass: "bg-amber-500",
    darkClass: "bg-amber-800"   
  },
  {
    id: 14,
    name: "Sky",
    hex: "#0EA5E9",      
    lightClass: "bg-sky-500",
    darkClass: "bg-sky-800"     
  },
  {
    id: 15,
    name: "Fuchsia",
    hex: "#D946EF",       
    lightClass: "bg-fuchsia-500",
    darkClass: "bg-fuchsia-800" 
  }
];

// Helper to get full color data from hex value
export const getColorData = (hex) => {
  return colorOptions.find(color => color.hex === hex) || colorOptions[0];
};







// import { getColorData } from './colorConfig';

// const WorkspaceCard = ({ workspace }) => {
//   // Get the color data from the hex value stored in database
//   const colorData = getColorData(workspace.color);
  
//   return (
//     <div className="p-4 border rounded-lg dark:border-gray-700">
//       <div className="flex items-center gap-3">
//         {/* Color indicator - automatically adapts to light/dark mode */}
//         <div className={`w-6 h-6 rounded-full ${colorData.lightClass} dark:${colorData.darkClass}`} />
//         <h3 className="font-medium">{workspace.name}</h3>
//       </div>
//       <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
//         {workspace.description}
//       </p>
//     </div>
//   );
// };