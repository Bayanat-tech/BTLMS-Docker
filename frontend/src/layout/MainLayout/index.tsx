import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

// material-ui
import { Box, Container, Toolbar, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// project import
import Breadcrumbs from 'components/@extended/Breadcrumbs';
// import Drawer from './Drawer';
// import Footer from './Footer';
import Header from './Header';
import Navigation from './Navigation';
import useConfig from 'hooks/useConfig';
import navigation from 'menu-items';
import { dispatch } from 'store';
import { openDrawer } from 'store/reducers/menu';

// ==============================|| MAIN LAYOUT ||============================== //

const MainLayout = () => {
  const theme = useTheme();
  const matchDownXL = useMediaQuery(theme.breakpoints.down('xl'));
  const { container, miniDrawer } = useConfig();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Set media-wise responsive drawer
  useEffect(() => {
    if (!miniDrawer) {
      dispatch(openDrawer(!matchDownXL));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchDownXL]);

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        backgroundColor: 'background.default'
      }}
    >
      <>
        <Navigation isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        <Header isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <Box
          component="main"
          sx={{
            width: 'calc(100% - 260px)',
            flexGrow: 1,
            p: { xs: 1, sm: 1 }
          }}
        >
          <Toolbar />
          <Container
            maxWidth={container ? 'xl' : false}
            sx={{
              ...(container && { px: { xs: 0, sm: 1 } }),
              position: 'relative',
              minHeight: 'calc(100vh - 110px)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Breadcrumbs navigation={navigation} title titleBottom card={false} divider={false} />

            <Outlet />
          </Container>
        </Box>
      </>
    </Box>
  );
};

export default MainLayout;
