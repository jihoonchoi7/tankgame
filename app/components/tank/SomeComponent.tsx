import { useState } from "react";
import { useGLTF } from "@react-three/drei";

// Example for future use
function ModelComponent() {
  const [modelError, setModelError] = useState(false);
  
  // Use try/catch with loading models
  let modelData = { scene: null };
  try {
    modelData = useGLTF("path/to/model.gltf");
  } catch (error) {
    console.error("Failed to load model:", error);
    setModelError(true);
  }
  
  // Return fallback if model failed to load
  if (modelError || !modelData.scene) {
    return <mesh><boxGeometry /><meshNormalMaterial /></mesh>;
  }
  
  return <primitive object={modelData.scene} />;
}

export default ModelComponent; 