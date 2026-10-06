import React from 'react';
import PianoMagico from '../../modules/piano-magico/PianoMagico';

/**
 * PianoStageView.jsx
 * Encapsula la experiencia musical y pedagógica del piano (pitch detection,
 * sintetizador soundfont, teclado virtual, AudioWorklet, evaluación de notas y feedback).
 * Reutiliza íntegramente la implementación probada y estable de PianoMagico
 * manteniéndola aislada del mundo 3D.
 */
export default function PianoStageView({
  userId,
  initialSong = null,
  initialMode = 'solo',
  onFinishLesson,
  onExitStage
}) {
  return (
    <div className="relative w-full h-full">
      <PianoMagico
        userId={userId}
        initialSong={initialSong}
        initialMode={initialMode}
        initialView="game"
        onExit={() => {
          if (onExitStage) onExitStage();
        }}
        onFinishLesson={(result) => {
          if (onFinishLesson) onFinishLesson(result);
        }}
      />
    </div>
  );
}
