import { MQ } from '../lib/constants';
import { useMediaQuery } from './useMediaQuery';

export const useReducedMotion = (): boolean => useMediaQuery(MQ.reducedMotion);
