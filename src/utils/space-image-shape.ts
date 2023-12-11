import { isEqual } from 'lodash';
import { Space } from '../apis/space/types';

export interface SpaceImageShape {
  label: string;
  value: string;
  criteria?: Pick<Space, 'imageConfig'>;
}

export const SpaceImageShapes: Record<string, SpaceImageShape> = {
  CIRCLE_DEFAULT: {
    label: 'Circle (Default)',
    value: 'CIRCLE_DEFAULT',
    criteria: {
      imageConfig: undefined,
    },
  },
  RECTANGLE_HEIGHT_200: {
    label: 'Rectangle (Height: 200px)',
    value: 'RECTANGLE_HEIGHT_200',
    criteria: {
      imageConfig: {
        fitType: 'contain',
        borderRadius: 0,
        width: '100%',
        height: '200px',
      },
    },
  },
  RECTANGLE_HEIGHT_300: {
    label: 'Rectangle (Height: 300px)',
    value: 'RECTANGLE_HEIGHT_300',
    criteria: {
      imageConfig: {
        fitType: 'contain',
        borderRadius: 0,
        width: '100%',
        height: '300px',
      },
    },
  },
  CUSTOM: {
    label: 'Custom',
    value: 'CUSTOM',
  },
};

export type SpaceImageShapeType = keyof typeof SpaceImageShapes;

export const getSpaceImageShapeValue = (
  criteria: SpaceImageShape['criteria']
): SpaceImageShape => {
  const imageShape = Object.values(SpaceImageShapes).find((shape) =>
    isEqual(shape.criteria?.imageConfig, criteria?.imageConfig)
  );
  return imageShape || SpaceImageShapes.CUSTOM;
};
