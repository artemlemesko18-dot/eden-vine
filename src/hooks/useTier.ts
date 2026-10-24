import { useSyncExternalStore } from 'react';
import { getTier, subscribeTier, type Tier } from '../lib/sceneStore';

export const useTier = (): Tier => useSyncExternalStore(subscribeTier, getTier, getTier);
