<?php
function validate_lesson($data) {
    if (!is_array($data)) throw new InvalidArgumentException('Leccion invalida');
    $title = trim($data['title'] ?? '');
    if ($title === '' || mb_strlen($title) > 255 || preg_match('/[<>\x00-\x1f]/u', $title)) throw new InvalidArgumentException('Nombre invalido');
    $sequence = $data['sequence'] ?? null;
    if (!is_array($sequence) || count($sequence) < 1 || count($sequence) > 2048) throw new InvalidArgumentException('Secuencia de 1 a 2048 notas requerida');
    foreach ($sequence as $note) {
        if (!is_string($note) || !preg_match('/^(?:[A-G]#?[0-8]?|R)(?::(?:\d+(?:\.\d+)?))?$/D', $note)) throw new InvalidArgumentException('Nota invalida');
        $parts = explode(':', $note);
        if (isset($parts[1]) && ((float)$parts[1] <= 0 || (float)$parts[1] > 32)) throw new InvalidArgumentException('Duracion invalida');
    }
    foreach (['speed' => [20, 6000], 'stickerId' => [1, 20], 'order_index' => [0, 100000]] as $key => $range) {
        if (!isset($data[$key]) || filter_var($data[$key], FILTER_VALIDATE_INT) === false || $data[$key] < $range[0] || $data[$key] > $range[1]) throw new InvalidArgumentException('Campo numerico invalido: ' . $key);
    }
    if (!in_array($data['rhythm'] ?? '', ['bubble', 'pop', 'rock', 'march', 'marcha', 'clasico'], true)) throw new InvalidArgumentException('Ritmo invalido');
    if (!isset($data['enabled']) || !is_bool($data['enabled'])) throw new InvalidArgumentException('Estado invalido');
    return ['title' => $title, 'sequence' => array_values($sequence), 'speed' => (int)$data['speed'], 'stickerId' => (int)$data['stickerId'],
        'order_index' => (int)$data['order_index'], 'rhythm' => $data['rhythm'], 'enabled' => $data['enabled']];
}
function content_gameplay_placement($record, $registry) {
    if (!in_array($record['regionId'] ?? '', array_column($registry['compositions'], 'regionId'), true)) throw new InvalidArgumentException('Region gameplay invalida');
    if (!content_vector($record['position'] ?? null) || !content_vector($record['rotation'] ?? null) || !content_vector($record['scale'] ?? null, true)) throw new InvalidArgumentException('Placement gameplay invalido');
}
function content_minigame_configuration($type, $config) {
    if (!is_array($config)) throw new InvalidArgumentException('Configuracion minigame requerida');
    if ($type === 'RHYTHM') {
        if (!is_int($config['bpm'] ?? null) || $config['bpm'] < 40 || $config['bpm'] > 180 || !is_int($config['toleranceMs'] ?? null) || $config['toleranceMs'] < 60 || $config['toleranceMs'] > 500) throw new InvalidArgumentException('Timing invalido');
        $pattern = $config['pattern'] ?? null;
        if (!is_array($pattern) || count($pattern) < 4 || count($pattern) > 16 || $pattern[0] !== 0) throw new InvalidArgumentException('Patron invalido');
        $last = -1;
        foreach ($pattern as $beat) { if (!is_numeric($beat) || $beat <= $last || $beat > 24) throw new InvalidArgumentException('Pulso invalido'); $last = $beat; }
    } else {
        $pool = $config['notePool'] ?? null;
        if (!is_array($pool) || count($pool) < 2 || count($pool) > 7 || count(array_unique($pool)) !== count($pool)) throw new InvalidArgumentException('Note pool invalido');
        foreach ($pool as $note) if (!is_string($note) || !preg_match('/^[A-G][3-5]$/D', $note)) throw new InvalidArgumentException('Nota minigame invalida');
        foreach ($type === 'SEQUENCE' ? ['sequenceLength'=>[2,6],'rounds'=>[1,5]] : ['questionCount'=>[2,10]] as $key=>$range)
            if (!is_int($config[$key] ?? null) || $config[$key] < $range[0] || $config[$key] > $range[1]) throw new InvalidArgumentException('Longitud minigame invalida');
        if ($type === 'NOTE_RECOGNITION' && !in_array($config['presentationMode'] ?? '', ['audio','visual'], true)) throw new InvalidArgumentException('Presentacion no implementada');
        if ($type === 'NOTE_RECOGNITION' && !in_array($config['difficulty'] ?? '', ['easy','normal'], true)) throw new InvalidArgumentException('Dificultad no implementada');
    }
}
function content_identifier($id) {
    return is_string($id) && strlen($id) <= 180 && preg_match('/^[a-zA-Z0-9_.:-]+$/D', $id);
}
function content_vector($value, $positive = false) {
    if (!is_array($value) || count($value) !== 3) return false;
    foreach ($value as $n) if ((!is_int($n) && !is_float($n)) || !is_finite((float)$n) || abs($n) > 10000 || ($positive && ($n <= 0 || $n > 100))) return false;
    return true;
}
function validate_game_content($data, $registry, $lessons) {
    if (!is_array($data) || ($data['schemaVersion'] ?? null) !== 1) throw new InvalidArgumentException('Version de contenido invalida');
    $rejectPlayerState = function($value) use (&$rejectPlayerState) {
        if (!is_array($value)) return;
        foreach ($value as $key => $child) {
            if (in_array($key,['entries','claimedRewards','total_score','collectedRewards','completedChallenges','discoveredRegions','openedGates','isCompleted','obtained'],true)) throw new InvalidArgumentException('Player state no pertenece al contenido');
            $rejectPlayerState($child);
        }
    };
    $rejectPlayerState($data);
    foreach (['world', 'activities', 'rewards', 'worldActions', 'minigames', 'gates'] as $key)
        if (!isset($data[$key]) || !is_array($data[$key]) || count($data[$key]) > 3000) throw new InvalidArgumentException('Coleccion invalida: ' . $key);
    $assets = array_column($registry['assets'], null, 'id');
    $urls = array_column($registry['assets'], null, 'url');
    $regions = array_column($registry['compositions'], null, 'id');
    $knownActivities = array_column($registry['activities'], null, 'id');
    $lessonIds = array_column($lessons, null, 'id');
    $seenRegions = []; $instanceIds = []; $instanceRegions = [];
    foreach ($data['world'] as $region) {
        $id = $region['id'] ?? '';
        if (!isset($regions[$id]) || isset($seenRegions[$id]) || ($region['regionId'] ?? '') !== $regions[$id]['regionId']) throw new InvalidArgumentException('Region invalida');
        $seenRegions[$id] = true;
        if (!is_array($region['instances'] ?? null) || count($region['instances']) > 1500) throw new InvalidArgumentException('Objetos invalidos');
        $local = [];
        foreach ($region['instances'] as $object) {
            if (!content_identifier($object['id'] ?? null) || isset($instanceIds[$object['id']])) throw new InvalidArgumentException('ID de objeto invalido o repetido');
            $instanceIds[$object['id']] = $local[$object['id']] = true;
            $instanceRegions[$object['id']] = $region['id'];
            if (!isset($urls[$object['assetUrl'] ?? ''])) throw new InvalidArgumentException('Asset fuera del catalogo');
            if (!content_vector($object['position'] ?? null) || !content_vector($object['rotation'] ?? null) || !content_vector($object['scale'] ?? null, true)) throw new InvalidArgumentException('Transform invalido');
            if (!in_array($object['grounding'] ?? '', ['terrain', 'absolute'], true) || !in_array($object['role'] ?? '', ['floor', 'architecture', 'mainTree', 'importantProp', 'decoration'], true)
                || !in_array($object['kind'] ?? '', ['props', 'trees', 'rocks', 'bushes'], true)) throw new InvalidArgumentException('Tipo de objeto invalido');
            $collision = $object['collision'] ?? ['type' => 'none'];
            if (!is_array($collision) || !in_array($collision['type'] ?? '', ['none', 'solid'], true)) throw new InvalidArgumentException('Colision invalida');
            if ($collision['type'] === 'solid') {
                if (!in_array($collision['shape'] ?? '', ['box', 'circle'], true) || !in_array($collision['source'] ?? '', ['base', 'bounds'], true)) throw new InvalidArgumentException('Forma de colision invalida');
                foreach (['radius', 'height'] as $field) if (isset($collision[$field]) && (!is_numeric($collision[$field]) || $collision[$field] <= 0 || $collision[$field] > 100)) throw new InvalidArgumentException('Dimension de colision invalida');
                foreach (['size', 'center'] as $field) if (isset($collision[$field]) && (!is_array($collision[$field]) || count($collision[$field]) !== 2 || !is_numeric($collision[$field][0]) || !is_numeric($collision[$field][1]))) throw new InvalidArgumentException('Vector de colision invalido');
                if (abs($object['rotation'][0]) > 1e-7 || abs($object['rotation'][2]) > 1e-7) throw new InvalidArgumentException('Colisiones requieren rotacion vertical');
                if (isset($collision['radius']) && $collision['shape'] !== 'circle') throw new InvalidArgumentException('Radio solo para circulos');
                if (isset($collision['size']) && ($collision['shape'] !== 'box' || $collision['size'][0] <= 0 || $collision['size'][1] <= 0)) throw new InvalidArgumentException('Tamano positivo solo para cajas');
            }
            foreach (['castShadow', 'receiveShadow'] as $field) if (isset($object[$field]) && !is_bool($object[$field])) throw new InvalidArgumentException('Shadow invalido');
            if (isset($object['interaction']) && (!is_array($object['interaction']) || !is_numeric($object['interaction']['radius'] ?? null) || $object['interaction']['radius'] <= 0 || $object['interaction']['radius'] > 20)) throw new InvalidArgumentException('Interaccion invalida');
            if (isset($object['tags']) && (!is_array($object['tags']) || count($object['tags']) > 20)) throw new InvalidArgumentException('Tags invalidos');
            foreach ($object['tags'] ?? [] as $tag) if (!content_identifier($tag)) throw new InvalidArgumentException('Tag invalido');
        }
        foreach ($regions[$id]['protectedIds'] as $protected) if (!isset($local[$protected])) throw new InvalidArgumentException('Objeto referenciado: no se puede eliminar ' . $protected);
    }
    if (count($seenRegions) !== count($regions)) throw new InvalidArgumentException('Falta una composicion');
    $rewards = [];
    foreach ($data['rewards'] as $reward) {
        if (!content_identifier($reward['id'] ?? null) || isset($rewards[$reward['id']]) || !is_bool($reward['enabled'] ?? null)
            || !is_string($reward['presentation'] ?? null) || strlen($reward['presentation']) > 500) throw new InvalidArgumentException('Recompensa invalida');
        if (!in_array($reward['type'] ?? '', ['PET', 'SECRET', 'COSMETIC_FUTURE'], true)) throw new InvalidArgumentException('Tipo de recompensa invalido');
        if ($reward['type'] === 'PET' && ($assets[$reward['referenceId'] ?? '']['category'] ?? '') !== 'PET') throw new InvalidArgumentException('Mascota inexistente');
        if ($reward['type'] !== 'PET' && !content_identifier($reward['referenceId'] ?? null)) throw new InvalidArgumentException('Referencia invalida');
        $rewards[$reward['id']] = $reward;
    }
    $activityIds = [];
    foreach ($data['activities'] as $activity) {
        $id = $activity['id'] ?? '';
        if (!isset($knownActivities[$id]) || isset($activityIds[$id])) throw new InvalidArgumentException('Actividad invalida');
        $activityIds[$id] = true; $known = $knownActivities[$id];
        foreach (['regionId', 'type', 'requirements', 'progressionReward'] as $field)
            if (($activity[$field] ?? null) != ($known[$field] ?? null)) throw new InvalidArgumentException('CP1 no altera topologia/requisitos/progresion');
        if ($activity['type'] !== 'SECRET_REWARD') {
            $lesson = $lessonIds[$activity['lessonId'] ?? ''] ?? null;
            if (!$lesson || $lesson['user_id'] !== null || $lesson['is_user_created'] || !$lesson['enabled']) throw new InvalidArgumentException('Leccion global activa requerida');
            if (!in_array($activity['assignmentStatus'] ?? '', ['VERIFICADA', 'PROVISIONAL'], true)) throw new InvalidArgumentException('Estado de asignacion invalido');
        } elseif (($activity['lessonId'] ?? null) !== null) throw new InvalidArgumentException('Un secreto no es una leccion');
        if (($activity['rewardId'] ?? null) !== null && !isset($rewards[$activity['rewardId']])) throw new InvalidArgumentException('Recompensa inexistente');
    }
    if (count($activityIds) !== count($knownActivities)) throw new InvalidArgumentException('Falta una actividad');
    $actionIds = [];
    foreach ($data['worldActions'] as $target) {
        if (!content_identifier($target['id'] ?? null) || isset($actionIds[$target['id']])) throw new InvalidArgumentException('Target invalido');
        $actionIds[$target['id']] = true;
        if (!in_array($target['type'] ?? '', ['WORLD_CREATURE', 'DESTRUCTIBLE'], true) || !isset($assets[$target['assetId'] ?? ''])) throw new InvalidArgumentException('Asset target invalido');
        if ($target['type'] === 'WORLD_CREATURE' && $assets[$target['assetId']]['category'] !== 'WORLD_CREATURE') throw new InvalidArgumentException('Criatura inexistente');
        if ($target['type'] === 'DESTRUCTIBLE' && !in_array($assets[$target['assetId']]['category'], ['PROP', 'DESTRUCTIBLE', 'DECORATION'], true)) throw new InvalidArgumentException('Prop requerido');
        if (!is_int($target['hitsRequired'] ?? null) || $target['hitsRequired'] < 1 || $target['hitsRequired'] > 3) throw new InvalidArgumentException('Solo 1-3 impactos');
        foreach (['hitReaction', 'defeatEffect', 'behaviorType'] as $field) if (!content_identifier($target[$field] ?? null)) throw new InvalidArgumentException('Campo target invalido');
        if ($target['type'] === 'WORLD_CREATURE' && $target['hitReaction'] !== 'none' && !in_array($target['hitReaction'], $registry['animationNames'], true)) throw new InvalidArgumentException('Clip de reaccion inexistente');
        if ($target['type'] === 'DESTRUCTIBLE' && $target['hitReaction'] !== 'none') throw new InvalidArgumentException('Destructible sin rig: reaccion none');
        if (($target['optionalReward'] ?? null) !== null && !isset($rewards[$target['optionalReward']])) throw new InvalidArgumentException('Reward target inexistente');
        if (!is_bool($target['enabledInWorld'] ?? null)) throw new InvalidArgumentException('Estado World Action invalido');
        if ($target['enabledInWorld']) {
            content_gameplay_placement($target, $registry);
            if (!in_array($target['behaviorType'], ['stationary','wander'], true) || $target['defeatEffect'] !== 'musical-particles') throw new InvalidArgumentException('Behavior/effect no implementado');
        }
    }
    $miniIds = [];
    foreach ($data['minigames'] as $mini) {
        if (!content_identifier($mini['id'] ?? null) || isset($miniIds[$mini['id']]) || !in_array($mini['type'] ?? '', ['NOTE_RECOGNITION', 'MELODY_RECOGNITION', 'RHYTHM', 'SEQUENCE', 'MEMORY', 'PIANO_CHALLENGE'], true) || !is_bool($mini['enabled'] ?? null)) throw new InvalidArgumentException('Minigame invalido');
        if ($mini['enabled']) {
            if (!in_array($mini['type'], ['NOTE_RECOGNITION','SEQUENCE','RHYTHM'], true)) throw new InvalidArgumentException('Motor minigame no implementado');
            content_minigame_configuration($mini['type'], $mini['configuration'] ?? null);
            if (!is_string($mini['name'] ?? null) || trim($mini['name']) === '' || strlen($mini['name']) > 160) throw new InvalidArgumentException('Nombre minigame invalido');
        }
        if (($mini['rewardId'] ?? null) !== null && !isset($rewards[$mini['rewardId']])) throw new InvalidArgumentException('Reward minigame invalido');
        if (($mini['lessonId'] ?? null) !== null && !isset($lessonIds[$mini['lessonId']])) throw new InvalidArgumentException('Leccion minigame inexistente');
        $miniIds[$mini['id']] = true;
    }
    $gateIds = [];
    foreach ($data['gates'] as $gate) {
        if (!content_identifier($gate['id'] ?? null) || isset($gateIds[$gate['id']]) || !isset($miniIds[$gate['minigameId'] ?? '']) || !is_bool($gate['enabled'] ?? null)) throw new InvalidArgumentException('Gate invalido');
        if ($gate['enabled']) {
            content_gameplay_placement($gate, $registry);
            $mini = array_values(array_filter($data['minigames'], fn($m) => $m['id'] === $gate['minigameId']))[0];
            if (!$mini['enabled']) throw new InvalidArgumentException('Gate requiere minigame activo');
            if (!is_array($gate['requirements'] ?? null)) throw new InvalidArgumentException('Requisitos gate invalidos');
            foreach ($gate['requirements'] as $id) if (!isset($miniIds[$id]) || $id === $gate['minigameId']) throw new InvalidArgumentException('Requisito gate invalido');
        }
        if (($gate['instanceId'] ?? null) !== null && !isset($instanceIds[$gate['instanceId']])) throw new InvalidArgumentException('Objeto gate inexistente');
        $gateIds[$gate['id']] = true;
    }
    if (isset($data['gameplayVersion'])) {
        if ($data['gameplayVersion'] !== 1 || !is_array($data['pets'] ?? null) || count($data['pets']) > 100) throw new InvalidArgumentException('Gameplay version invalida');
        $pets = [];
        foreach ($data['pets'] as $pet) {
            if (!content_identifier($pet['id'] ?? null) || isset($pets[$pet['id']]) || !is_bool($pet['enabled'] ?? null) || ($assets[$pet['assetId'] ?? '']['category'] ?? '') !== 'PET'
                || !is_string($pet['name'] ?? null) || trim($pet['name']) === '' || strlen($pet['name']) > 100) throw new InvalidArgumentException('Pet invalida');
            $pets[$pet['id']] = true;
        }
        foreach ($data['rewards'] as $reward) if ($reward['type'] === 'PET' && !isset($pets[$reward['referenceId']])) throw new InvalidArgumentException('Reward pet fuera de coleccion');
    }
    return array_intersect_key($data, array_flip(['schemaVersion', 'world', 'activities', 'rewards', 'worldActions', 'minigames', 'gates', 'pets', 'gameplayVersion']));
}
