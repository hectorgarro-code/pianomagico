export const PLAYER_COLLIDER = Object.freeze({radius:0.34});
const EPS=1e-7;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function circleContact(position,radius,collider) {
  if(collider.type!=='solid') return null;
  if(collider.shape==='circle') {
    const x=position.x-collider.x,z=position.z-collider.z,d=Math.hypot(x,z),r=radius+collider.radius;
    return d<r-EPS?{x:d>EPS?x/d:1,z:d>EPS?z/d:0,depth:r-d}:null;
  }
  const cos=Math.cos(collider.yaw),sin=Math.sin(collider.yaw);
  const dx=position.x-collider.x,dz=position.z-collider.z;
  const x=cos*dx-sin*dz,z=sin*dx+cos*dz;
  const nx=x-clamp(x,-collider.halfWidth,collider.halfWidth),nz=z-clamp(z,-collider.halfDepth,collider.halfDepth);
  const d=Math.hypot(nx,nz);
  let localX,localZ,depth;
  if(d>EPS) {
    if(d>=radius-EPS) return null;
    localX=nx/d;localZ=nz/d;depth=radius-d;
  } else {
    const ax=collider.halfWidth-Math.abs(x),az=collider.halfDepth-Math.abs(z);
    if(ax<az){localX=x>=0?1:-1;localZ=0;depth=radius+ax;}
    else{localX=0;localZ=z>=0?1:-1;depth=radius+az;}
  }
  return {x:cos*localX+sin*localZ,z:-sin*localX+cos*localZ,depth};
}

function extent(c) {
  if(c.shape==='circle') return [c.radius,c.radius];
  const cos=Math.abs(Math.cos(c.yaw)),sin=Math.abs(Math.sin(c.yaw));
  return [cos*c.halfWidth+sin*c.halfDepth,sin*c.halfWidth+cos*c.halfDepth];
}

// Static spatial hash; narrow phase operates only on nearby cached primitives.
export class CollisionWorld {
  constructor(colliders=[],cellSize=4) {
    this.colliders=colliders.filter(c=>c.type==='solid');this.cellSize=cellSize;
    this.cells=new Map();this.lastChecks=0;
    for(const c of this.colliders) {
      const [ex,ez]=extent(c);
      this.visitCells(c.x-ex,c.z-ez,c.x+ex,c.z+ez,key=>{
        if(!this.cells.has(key))this.cells.set(key,[]);
        this.cells.get(key).push(c);
      });
    }
  }
  visitCells(minX,minZ,maxX,maxZ,visit) {
    for(let x=Math.floor(minX/this.cellSize);x<=Math.floor(maxX/this.cellSize);x++)
      for(let z=Math.floor(minZ/this.cellSize);z<=Math.floor(maxZ/this.cellSize);z++)visit(x+':'+z);
  }
  query(x,z,radius) {
    const result=new Set();
    this.visitCells(x-radius,z-radius,x+radius,z+radius,key=>{for(const c of this.cells.get(key)||[])result.add(c);});
    return result;
  }
  overlaps(position,radius=PLAYER_COLLIDER.radius) {
    for(const c of this.query(position.x,position.z,radius))if(circleContact(position,radius,c))return true;
    return false;
  }
  separate(position,radius) {
    const p={x:position.x,z:position.z};
    for(let pass=0;pass<8;pass++) {
      let changed=false;
      for(const c of this.query(p.x,p.z,radius)) {
        this.lastChecks++;
        const contact=circleContact(p,radius,c);
        if(contact){p.x+=contact.x*(contact.depth+EPS);p.z+=contact.z*(contact.depth+EPS);changed=true;}
      }
      if(!changed)break;
    }
    return p;
  }
  move(position,displacement,radius=PLAYER_COLLIDER.radius) {
    this.lastChecks=0;
    let p=this.separate(position,radius);
    // Substeps smaller than the player radius prevent tunnelling through thin walls.
    const steps=Math.max(1,Math.ceil(Math.hypot(displacement.x,displacement.z)/(radius*.5)));
    const dx=displacement.x/steps,dz=displacement.z/steps;
    for(let i=0;i<steps;i++) {
      const next=this.separate({x:p.x+dx,z:p.z+dz},radius);
      if(!this.overlaps(next,radius))p=next;
    }
    return p;
  }
}
