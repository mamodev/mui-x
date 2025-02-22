import * as React from 'react';
import { unstable_useEnhancedEffect as useEnhancedEffect } from '@mui/material/utils';
import { unstable_composeClasses } from '@mui/utils';
import { DataGridProcessedProps } from '../../models/props/DataGridProps';
import { useGridSelector } from '../../hooks/utils/useGridSelector';
import { gridVisibleRowCountSelector } from '../../hooks/features/filter/gridFilterSelector';
import {
  gridRowCountSelector,
  gridRowsLoadingSelector,
} from '../../hooks/features/rows/gridRowsSelector';
import { useGridApiContext } from '../../hooks/utils/useGridApiContext';
import { useGridRootProps } from '../../hooks/utils/useGridRootProps';
import { gridDensityTotalHeaderHeightSelector } from '../../hooks/features/density/densitySelector';
import { getDataGridUtilityClass } from '../../constants/gridClasses';

const useUtilityClasses = (ownerState: { classes: DataGridProcessedProps['classes'] }) => {
  const { classes } = ownerState;

  const slots = {
    root: ['overlayWrapper'],
  };

  return unstable_composeClasses(slots, getDataGridUtilityClass, classes);
};

function GridOverlayWrapper(props: React.PropsWithChildren<{}>) {
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();
  const classes = useUtilityClasses({ classes: rootProps.classes });

  const totalHeaderHeight = useGridSelector(apiRef, gridDensityTotalHeaderHeightSelector);

  const [viewportInnerSize, setViewportInnerSize] = React.useState(
    () => apiRef.current.getRootDimensions()?.viewportInnerSize ?? null,
  );

  const handleViewportSizeChange = React.useCallback(() => {
    setViewportInnerSize(apiRef.current.getRootDimensions()?.viewportInnerSize ?? null);
  }, [apiRef]);

  useEnhancedEffect(() => {
    return apiRef.current.subscribeEvent('viewportInnerSizeChange', handleViewportSizeChange);
  }, [apiRef, handleViewportSizeChange]);

  let height: React.CSSProperties['height'] = viewportInnerSize?.height ?? 0;
  if (rootProps.autoHeight && height === 0) {
    height = 'auto';
  }

  if (!viewportInnerSize) {
    return null;
  }

  return (
    <div
      className={classes.root}
      style={{
        height,
        width: viewportInnerSize?.width ?? 0,
        position: 'absolute',
        top: totalHeaderHeight,
        bottom: height === 'auto' ? 0 : undefined,
        zIndex: 1,
      }}
      {...props}
    />
  );
}

export function GridOverlays() {
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();

  const totalRowCount = useGridSelector(apiRef, gridRowCountSelector);
  const visibleRowCount = useGridSelector(apiRef, gridVisibleRowCountSelector);
  const loading = useGridSelector(apiRef, gridRowsLoadingSelector);

  const showNoRowsOverlay = !loading && totalRowCount === 0;
  const showNoResultsOverlay = !loading && totalRowCount > 0 && visibleRowCount === 0;

  let overlay: JSX.Element | null = null;

  if (showNoRowsOverlay) {
    overlay = <rootProps.components.NoRowsOverlay {...rootProps.componentsProps?.noRowsOverlay} />;
  }

  if (showNoResultsOverlay) {
    overlay = (
      <rootProps.components.NoResultsOverlay {...rootProps.componentsProps?.noResultsOverlay} />
    );
  }

  if (loading) {
    overlay = (
      <rootProps.components.LoadingOverlay {...rootProps.componentsProps?.loadingOverlay} />
    );
  }

  if (overlay === null) {
    return null;
  }

  return <GridOverlayWrapper>{overlay}</GridOverlayWrapper>;
}
