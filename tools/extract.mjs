// Extracts named props out of a room scene, re-based so that each sits on the ground at the origin.
// node tools/extract.mjs in.glb out_prefix "name=regex[:simplify-ratio]" ... (needs @gltf-transform/core, @gltf-transform/functions, @gltf-transform/extensions, meshoptimizer, draco3dgltf)
import { NodeIO, getBounds, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, simplify, weld, cloneDocument } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
const [input, prefix, ...specs] = process.argv.slice(2);
const source = await io.read(input);
for (const spec of specs) {
  const [name, rest] = spec.split('='); const [re, ratio] = rest.split(':');
  const rx = new RegExp(re);
  const doc = cloneDocument(source);
  const root = doc.getRoot();
  let kept = 0;
  for (const node of root.listNodes()) { if (node.getMesh()) { if (rx.test(node.getName())) kept++; else node.setMesh(null); } }
  if (!kept) { console.log(name, ': no node matches', re); continue; }
  await doc.transform(prune({ keepLeaves: false }), dedup());
  if (ratio) await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: +ratio, error: 0.001 }));
  const scene = root.listScenes()[0];
  const b = getBounds(scene);
  const c = [(b.min[0] + b.max[0]) / 2, b.min[1], (b.min[2] + b.max[2]) / 2];
  const wrap = doc.createNode('root').setTranslation([-c[0], -c[1], -c[2]]);
  for (const n of scene.listChildren()) { scene.removeChild(n); wrap.addChild(n); }
  scene.addChild(wrap);
  await doc.transform(prune());
  let tris = 0; for (const m of root.listMeshes()) for (const p of m.listPrimitives()) tris += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
  const out = `${prefix}${name}.glb`;
  await io.write(out, doc);
  console.log(name.padEnd(16), 'nodes', kept, 'tris', Math.round(tris), 'size', b.max.map((v, i) => (v - b.min[i]).toFixed(2)).join('x'), '->', out);
}
