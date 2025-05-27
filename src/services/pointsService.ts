import { Point } from '../types';

let points: Point[] = [];

export function setPoints(p: Point[]): void {
  points = p;
}

export function getPoints(): Point[] {
  return points;
}