import ValleyLessonEntry from '../piano/ValleyLessonEntry.jsx';

export default function AdventureDiscovery({ object, song, state, onStart, onClose, onClaimSecret }) {
  return <ValleyLessonEntry {...{ object, song, state, onStart, onClose, onClaimSecret }}/>;
}
