import Map from '../components/Map';

export default function Home() {
  return (
    <div className="h-screen w-full">
      <Map 
        center={[2.19, 41.39]} // Barcelona
        zoom={9.5}
        height="100vh"
        className=""
      />
    </div>
  );
}
