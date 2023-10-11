import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BOX_LAYER = 1;
const SPHERE_LAYER = 2;

const Scene = forwardRef((_, ref) => {
  const { gl, scene, camera } = useThree();
  const meshRef = useRef();
  const captureCameraRef = useRef();

  useEffect(() => {
    // 本当はカメラをdisposeする必要がありそう
    captureCameraRef.current = camera.clone(true);
    captureCameraRef.current.layers.enable(BOX_LAYER);
    camera.layers.enable(BOX_LAYER);
    camera.layers.enable(SPHERE_LAYER);
  }, [camera]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  const takeScreenshot = () => {
    const rt = new THREE.WebGLRenderTarget(window.innerWidth * 0.5, window.innerHeight);
    gl.setRenderTarget(rt);
    gl.render(scene, captureCameraRef.current);
    gl.setRenderTarget(null);

    const imgData = new Uint8Array(gl.domElement.width * gl.domElement.height * 4);
    gl.readRenderTargetPixels(rt, 0, 0, gl.domElement.width, gl.domElement.height, imgData);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = gl.domElement.width;
    canvas.height = gl.domElement.height;

    const idata = ctx.createImageData(canvas.width, canvas.height);
    idata.data.set(imgData);
    ctx.putImageData(idata, 0, 0);

    return canvas.toDataURL();
  };

  useImperativeHandle(ref, () => ({
    takeScreenshot
  }));

  return (
    <>
      <ambientLight />
      <mesh ref={meshRef} layers={BOX_LAYER}>
        <boxGeometry attach="geometry" args={[1, 1, 1]} />
        <meshStandardMaterial attach="material" color="hotpink" />
      </mesh>
      {Array.from({ length: 10 }).map((_, index) => (
        <mesh key={index} layers={SPHERE_LAYER} position={[Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5]}>
          <sphereGeometry attach="geometry" args={[0.2, 32, 32]} />
          <meshStandardMaterial attach="material" color="grey" />
        </mesh>
      ))}
    </>
  );
});

function App() {
  const [screenshot, setScreenshot] = useState(null);
  const sceneRef = useRef();

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      <div style={{ flex: 1 }}>
        <Canvas camera={{ layers: BOX_LAYER + SPHERE_LAYER }}>
          <Scene ref={sceneRef} />
        </Canvas>
        <button style={{ position: 'absolute', top: '10px', left: '10px' }} onClick={() => {
          const result = sceneRef.current.takeScreenshot();
          setScreenshot(result);
        }}>
          スクリーンキャプチャ
        </button>
      </div>
      <div style={{ flex: 1, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {screenshot && <img src={screenshot} alt="スクリーンキャプチャ" />}
      </div>
    </div>
  );
}

export default App;
