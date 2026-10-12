import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import World3DView from '../world/World3DView.jsx';

const WorldContext = createContext(null);
export function SharedWorldProvider({ children, presentation = true, backdrop = null }) {
  const [config, setConfig] = useState(null);
  const [started,setStarted]=useState(false),lastConfig=useRef(null);
  const publish=useCallback(value=>{if(value){lastConfig.current=value;setStarted(true);}setConfig(value);},[]);
  return <WorldContext.Provider value={publish}>
    {!config && backdrop}
    <div className={`entry-world ${!config || config?.hidden ? 'entry-world-hidden' : ''}`}>
      {started && <World3DView {...(config || lastConfig.current)} active={config?.active ?? false} presentation={presentation} />}
    </div>
    {children}
  </WorldContext.Provider>;
}

// The publisher owns session props; the provider retains one gameplay renderer.
export default function SharedWorld(props) {
  const publish = useContext(WorldContext), latest = useRef(props);
  latest.current = props;
  const callbacks = useMemo(() => Object.fromEntries(['onEnterLesson','onDiscoverAdventure','onObjectiveProgress','onAdventureDebug','onPlaytestEvent','onGameplayReward','onMinigame'].map(key => [key, (...args) => latest.current[key]?.(...args)])), []);
  useLayoutEffect(() => {
    publish?.({ ...props, ...callbacks });
  }, [publish, props.active, props.hidden, props.sessionKey, props.profile, props.adventureState, props.gameplayState,
    props.songs, props.userPerformances, props.memoryMedals, props.returnContext, props.initialPosition,
    props.initialRotation, props.debugEnabled, props.equipmentVersion, props.mapRequest, props.completedStationIds?.join('|'), callbacks]);
  useLayoutEffect(() => () => publish?.(null), [publish]);
  return publish ? null : <World3DView {...props} />;
}
