(function(){
  const any = new Proxy(function(){}, {get:(t,p) => p === Symbol.toPrimitive ? () => 0 : any, apply:() => any});
  const st = {frames:0, composerFrames:0, lastCam:[0,0,0], budget:null, contexts:0, disposed:0};
  class FakeRenderer {
    constructor(){ this.domElement = document.createElement('canvas'); this.shadowMap = {enabled:false, type:0, autoUpdate:true};
      this.capabilities = {isWebGL2:true, maxTextureSize:8192, getMaxAnisotropy:() => 16};
      this.outputEncoding = 3000; this.toneMapping = 0; this.toneMappingExposure = 1; this.autoClear = true;
      this.info = {render:{}, memory:{}}; this._pr = 1; this._w = 1280; this._h = 720; this._rt = null; this.state = any; this.xr = {enabled:false};
      this.extensions = {get:() => ({}), has:() => true}; st.contexts++; }
    setPixelRatio(p){ this._pr = p; } getPixelRatio(){ return this._pr; }
    setSize(w,h){ this._w = w; this._h = h; } getSize(v){ return v.set(this._w, this._h); }
    getDrawingBufferSize(v){ return v.set(this._w*this._pr, this._h*this._pr); }
    setAnimationLoop(fn){ window.__loop = fn; }
    render(scene, cam){
      st.frames++; if (this._rt) st.composerFrames++;
      scene.updateMatrixWorld(); if (cam && cam.isPerspectiveCamera) st.lastCam = cam.position.toArray();
      if (!st.budget && scene.children.length > 20){ let calls = 0, tris = 0, shadow = 0, lights = 0;
        scene.traverse(o => { if (o.isLight && !o.isAmbientLight) lights++;
          if (!(o.isMesh || o.isPoints || o.isSprite) || !o.visible) return; calls++; if (o.castShadow) shadow++;
          const g = o.geometry, n = g.index ? g.index.count/3 : (g.attributes.position.count/3);
          tris += (o.isInstancedMesh ? n*o.count : (o.isMesh ? n : 0)); });
        st.budget = {calls, shadowCasters:shadow, tris:Math.round(tris), lights};
        /* anything that is not part of the board must stay out of the board's volume */
        const box = new THREE.Box3(), v = new THREE.Vector3(), vol = new THREE.Box3(new THREE.Vector3(-9.9, 0.2, -4), new THREE.Vector3(9.9, 3, 4.2));
        st.collisions = [];
        scene.traverse(o => {
          if (!o.isMesh || o.isInstancedMesh) return;
          for (let a = o; a; a = a.parent) if (a.userData && a.userData.board) return;
          box.setFromObject(o); box.getSize(v);
          if (Math.max(v.x, v.y, v.z) > 200) return;
          if (!box.intersectsBox(vol)) return;
          const P = o.geometry.attributes.position, w = new THREE.Vector3(); let inside = 0;
          for (let i = 0; i < P.count; i++){ w.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); if (vol.containsPoint(w)) inside++; }
          if (inside) st.collisions.push(inside + ' vertices of ' + (o.material && o.material.color ? '#' + o.material.color.getHexString() : '?') + ' @ ' + box.getCenter(v).toArray().map(n => n.toFixed(1)).join(','));
        }); }
      scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        for (const m of ms) if (m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile && !m.__ok && m.type === 'MeshStandardMaterial'){
          const sh = {vertexShader:THREE.ShaderLib.standard.vertexShader, fragmentShader:'', uniforms:{}};
          m.onBeforeCompile(sh, this); if (!/aUV|aGlow/.test(sh.vertexShader)) throw new Error('material shader patch failed');
          m.__ok = true; } });
    }
    setRenderTarget(rt){ this._rt = rt; } getRenderTarget(){ return this._rt; }
    clear(){} getClearColor(c){ return c.set(0); } setClearColor(){} getClearAlpha(){ return 1; } setClearAlpha(){}
    compile(){} dispose(){ st.disposed++; } forceContextLoss(){} initTexture(){} readRenderTargetPixels(){} copyFramebufferToTexture(){} getContext(){ return any; }
  }
  THREE.WebGLRenderer = FakeRenderer;
  THREE.PMREMGenerator = class { constructor(){} fromScene(){ return {texture:new THREE.Texture(), dispose(){}}; } dispose(){} };
  window.__renderer = () => st;
})();
