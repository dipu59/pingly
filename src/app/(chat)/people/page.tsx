import PeopleList from './PeopleList';

export const metadata = {
  title: 'People | Pingly',
};

export default function PeoplePage() {
  return (
    <div className="flex h-full w-full flex-col p-8" style={{ background: 'var(--color-bg)' }}>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">People Directory</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Find and connect with anyone on Pingly
        </p>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        <PeopleList />
      </div>
    </div>
  );
}
