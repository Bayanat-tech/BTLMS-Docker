import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { Print, PictureAsPdf } from '@mui/icons-material';
import HrServiceInstance from 'service/Service.hr';
import { convertToWords } from 'react-number-to-words';
import { createPayslipPDF, COMPANY_ADDRESS } from '../../utils/payslipPdf';
import React from 'react';
import useAuth from 'hooks/useAuth';

const COMPANY_LOGO_URL =
  'https://axpnrpp1t5qs.compat.objectstorage.me-dubai-1.oraclecloud.com/app-dev-bucket-test/CompanyLogos/cf77c7ad-95de-4842-9fee-730ddbd06be7.png';

// Interface for employee data
interface IHrEmployee {
  EMPLOYEE_ID: string;
  EMPLOYEE_CODE: string;
  RPT_NAME: string;
}

const BT_ViewPayslipReport = () => {
  const { employeeId, month, year } = useParams<{ employeeId: string; month: string; year: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPrintView = searchParams.get('print') === 'true';
  const { user } = useAuth();

  // Validate if the selected year is current year
const currentYear = new Date().getFullYear();
const previousYear = currentYear - 1;
const isAllowedYear = year === currentYear.toString() || year === previousYear.toString();

  console.log('🔍 ViewPayslipReport - Initial params:', {
    employeeId,
    month, 
    year,
    currentUser: user?.loginid1,
    isAllowedYear
  });

  // Fetch supervisor employees data for permission check
  const { data: currentSupervisorEmployeeData, isLoading: isLoadingSupervisor } = useQuery<IHrEmployee[]>({
    queryKey: ['currentSupervisorEmployeeData', user?.loginid1],
    queryFn: async (): Promise<IHrEmployee[]> => {
      if (!user?.loginid1) {
        console.log(' No user ID for supervisor check');
        return [];
      }
      console.log('🔄 Fetching supervisor team for:', user.loginid1);
      
      try {
        // SQL query to get employees under this supervisor
        const sql = `
              SELECT DISTINCT *
              FROM (
                  SELECT *
                  FROM VW_HR_EMPLOYEE
                  WHERE EMP_STATUS <> 'S'
                  START WITH 
                      EMPLOYEE_ID = '${user.loginid1}'
                      OR SUPERVISOR_EMPID = '${user.loginid1}'
                      OR DEPT_HEAD_EMPID = '${user.loginid1}'
                      OR MANGR_EMPID = '${user.loginid1}'
                  CONNECT BY NOCYCLE PRIOR EMPLOYEE_ID = SUPERVISOR_EMPID
                      OR PRIOR EMPLOYEE_ID = DEPT_HEAD_EMPID
                      OR PRIOR EMPLOYEE_ID = MANGR_EMPID
              )
        `;
        console.log('Supervisor SQL:', sql);
        
        const data = await HrServiceInstance.executeRawSql(sql);
        console.log('Supervisor team response:', data);
        
        if (Array.isArray(data)) {
          console.log(`✅ Found ${data.length} team members:`, data.map(e => `${e.EMPLOYEE_ID} - ${e.RPT_NAME}`));
          return data;
        }
        
        console.log(' No team members found');
        return [];
      } catch (err) {
        console.error('Error fetching supervisor team:', err);
        return [];
      }
    },
    retry: false,
    enabled: !!user?.loginid1
  });

  // Check if user has permission to view this payslip
  const hasPermission = React.useMemo(() => {
    console.log(' Checking permission...');
    console.log(' Current user:', user?.loginid1);
    console.log(' Requested employee:', employeeId);
    console.log(' Supervisor data loaded:', !isLoadingSupervisor);
    console.log(' Team members count:', currentSupervisorEmployeeData?.length || 0);
    console.log(' Team member IDs:', currentSupervisorEmployeeData?.map((e: IHrEmployee) => e.EMPLOYEE_ID));

    // User can always view their own payslip
    if (user?.loginid1 === employeeId) {
      console.log(' Permission GRANTED: User viewing own payslip');
      return true;
    }
    
    // Supervisor can view payslips of employees under them
    if (!isLoadingSupervisor && currentSupervisorEmployeeData && currentSupervisorEmployeeData.length > 0) {
      const isTeamMember = currentSupervisorEmployeeData.some((emp: IHrEmployee) => {
        const isMatch = emp.EMPLOYEE_ID === employeeId;
        console.log(` Checking ${emp.EMPLOYEE_ID} === ${employeeId}: ${isMatch}`);
        return isMatch;
      });
      
      if (isTeamMember) {
        console.log('Permission GRANTED: Supervisor viewing team member payslip');
        return true;
      } else {
        console.log(' Permission DENIED: Employee not in supervisor team');
      }
    } else {
      console.log('Permission DENIED: Not supervisor or no team data');
    }
    
    console.log(' FINAL: Permission DENIED');
    return false;
  }, [user?.loginid1, employeeId, currentSupervisorEmployeeData, isLoadingSupervisor]);

  // SQL queries for payslip data (always defined, but conditionally enabled)
  const headerSql = `
    SELECT DISTINCT *
    FROM VW_BOHC_PAYSLIP_HDR 
    WHERE EMPLOYEE_ID = '${employeeId}' 
    AND PAY_MONTH = '${month}' 
    AND PAY_YEAR = '${year}'
  `;
  
  const earningsSql = `
    SELECT DISTINCT PAY_COMP_DESC, PAY_COMP_AMT, SORT_ORDER
    FROM VW_BOHC_PAYSLIP_DTL_EARNINGS 
    WHERE EMPLOYEE_ID = '${employeeId}' 
    AND PAY_MONTH = '${month}' 
    AND PAY_YEAR = '${year}'
    ORDER BY SORT_ORDER
  `;
  
  const deductionsSql = `
    SELECT DISTINCT PAY_COMP_DESC, PAY_COMP_AMT, SORT_ORDER
    FROM VW_BOHC_PAYSLIP_DTL_DEDUCTIONS 
    WHERE EMPLOYEE_ID = '${employeeId}' 
    AND PAY_MONTH = '${month}' 
    AND PAY_YEAR = '${year}'
    ORDER BY SORT_ORDER
  `;

  // Fetch data using useQuery - conditionally enabled based on permission
  const { data: headerData, isLoading: headerLoading, error: headerError } = useQuery({
    queryKey: ['payslip_header', employeeId, month, year],
    queryFn: () => HrServiceInstance.executeRawSql(headerSql),
    enabled: hasPermission && !!employeeId && !!month && !!year && isAllowedYear,
    refetchOnWindowFocus: false
  });

  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ['payslip_earnings', employeeId, month, year],
    queryFn: () => HrServiceInstance.executeRawSql(earningsSql),
    enabled: hasPermission && !!employeeId && !!month && !!year && isAllowedYear,
    refetchOnWindowFocus: false
  });

  const { data: deductionsData, isLoading: deductionsLoading } = useQuery({
    queryKey: ['payslip_deductions', employeeId, month, year],
    queryFn: () => HrServiceInstance.executeRawSql(deductionsSql),
    enabled: hasPermission && !!employeeId && !!month && !!year && isAllowedYear,
    refetchOnWindowFocus: false
  });

  // Define isLoading here 
  const isLoading = headerLoading || earningsLoading || deductionsLoading;

  // Auto-print if in print view 
  React.useEffect(() => {
    if (isPrintView && !isLoading && headerData?.[0]) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [isPrintView, isLoading, headerData]);

  // Show loading while checking permissions
  if (isLoadingSupervisor) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Checking access permissions...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Show permission error if user doesn't have access
  if (!hasPermission) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Access Denied</Typography>
          You don't have permission to view this employee's payslip
        </Alert>
        
        <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            <strong>Debug Information:</strong><br />
            Current User: {user?.loginid1}<br />
            Requested Employee: {employeeId}<br />
            Is Supervisor: {currentSupervisorEmployeeData && currentSupervisorEmployeeData.length > 0 ? 'Yes' : 'No'}<br />
            Team Members: {currentSupervisorEmployeeData?.length || 0}<br />
            Team IDs: {currentSupervisorEmployeeData?.map((e: IHrEmployee) => e.EMPLOYEE_ID).join(', ') || 'None'}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/hr/Activity/Request/employee_payslip')}
            size="large"
          >
            Back to Payslip Search
          </Button>
        </Box>
      </Container>
    );
  }

  // Show error if trying to access non-current year
  if (!isAllowedYear) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          You can only access payslips for the current year ({currentYear}). 
          Selected year: {year}
        </Alert>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/hr/Activity/Request/employee_payslip')}
          >
            Back to Search
          </Button>
        </Box>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (headerError || !headerData?.[0]) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          {headerError ? 'Failed to load payslip data' : 'No payslip data found for the selected criteria'}
        </Alert>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/hr/Activity/Request/employee_payslip')}
          >
            Back to Search
          </Button>
        </Box>
      </Container>
    );
  }

  const header = headerData[0];
  const earnings = earningsData || [];
  const deductions = deductionsData || [];

  // Calculate totals
  const grossEarnings = Number(header.GROSS_EARNINGS ?? earnings.reduce((sum: number, item: any) => sum + Number(item.PAY_COMP_AMT || 0), 0));
  const grossDeductions = Number(header.GROSS_DEDUCTIONS ?? deductions.reduce((sum: number, item: any) => sum + Number(item.PAY_COMP_AMT || 0), 0));
  const netSalary = Number(header.NET_SALARY ?? (grossEarnings - grossDeductions));

// Function to convert amount to words with dynamic currency
const convertAmountToWords = (amount: number, currency: string = 'RIALS'): string => {
  try {
    if (amount === 0) return `ZERO ${currency.toUpperCase()} ONLY`;
    
    // For Omani Rial (OMR) - use Rials and Baisa
    if (currency === 'OMR' || currency === 'RIALS') {
      const rials = Math.floor(amount);
      const baisa = Math.round((amount - rials) * 1000);
      
      let words = '';
      
      if (rials > 0) {
        words += convertToWords(rials).toUpperCase() + ' RIALS';
      }
      
      if (baisa > 0) {
        if (rials > 0) {
          words += ' AND ';
        }
        words += convertToWords(baisa).toUpperCase() + ' BAISA';
      }
      
      return words + ' ONLY';
    } 
    // For Indian Rupee (INR) - use Rupees and Paise
    else if (currency === 'INR' || currency === 'INDIAN RUPEE') {
      const rupees = Math.floor(amount);
      const paise = Math.round((amount - rupees) * 100);
      
      let words = '';
      
      if (rupees > 0) {
        words += convertToWords(rupees).toUpperCase() + ' RUPEES';
      }
      
      if (paise > 0) {
        if (rupees > 0) {
          words += ' AND ';
        }
        words += convertToWords(paise).toUpperCase() + ' PAISE';
      }
      
      return words + ' ONLY';
    }
    // For other currencies - use generic format
    else {
      const mainUnit = Math.floor(amount);
      const fractional = Math.round((amount - mainUnit) * 100);
      
      let words = '';
      
      if (mainUnit > 0) {
        words += convertToWords(mainUnit).toUpperCase() + ` ${currency.toUpperCase()}`;
      }
      
      if (fractional > 0) {
        if (mainUnit > 0) {
          words += ' AND ';
        }
        words += convertToWords(fractional).toUpperCase() + ' CENTS';
      }
      
      return words + ' ONLY';
    }
  } catch (error) {
    console.error('Error converting amount to words:', error);
    return 'AMOUNT IN WORDS UNAVAILABLE';
  }
};

  // Function to export PDF with improved styling
  const exportToPDF = async () => {
    const element = document.getElementById('payslip-content');
    if (!element) {
      alert('Cannot generate PDF: Payslip content not found');
      return;
    }

    try {
      const pdf = await createPayslipPDF({ header, earnings, deductions, grossEarnings, grossDeductions, netSalary, period: getMonthName(String(header.PAY_MONTH)) + ' ' + header.PAY_YEAR, words: convertAmountToWords(Number(netSalary), header.CURR_NAME), logoUrl: COMPANY_LOGO_URL });
      pdf.save(`Payslip_${employeeId}_${month}_${year}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Function to print directly
  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number): string => {
    return Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getMonthName = (monthNum: string) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[parseInt(monthNum) - 1] || monthNum;
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        '@media print': {
          maxWidth: 'none !important',
          width: '100%',
          p: '0 !important'
        }
      }}
    >
      <Box
        className="no-print"
        sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1 }}
      >
        <Tooltip title="Print">
          <IconButton onClick={handlePrint} color="primary">
            <Print />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download PDF">
          <IconButton onClick={exportToPDF} color="secondary">
            <PictureAsPdf />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper
        id="payslip-content"
        elevation={2}
        sx={{
          boxSizing: 'border-box',
          maxWidth: 940,
          minHeight: 0,
          p: { xs: 2, sm: 4 },
          mx: 'auto',
          my: 2,
          color: '#171717',
          backgroundColor: '#fff',
          fontFamily: 'Arial, sans-serif',
          '& *': { fontFamily: 'Arial, sans-serif' },
          '@media print': {
            width: '100%',
            maxWidth: 'none',
            minHeight: 0,
            boxShadow: 'none',
            m: 0,
            p: '0 !important',
            '& .no-print': { display: 'none !important' }
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            minHeight: 52,
            pb: 1,
            borderBottom: '2px solid #171717'
          }}
        >
          <Box
            component="img"
            src={COMPANY_LOGO_URL}
            alt="Company logo"
            sx={{ display: 'block', maxWidth: 230, width: 'auto', height: 44, objectFit: 'contain' }}
          />
        </Box>

        <Typography sx={{ fontSize: '0.75rem', textAlign: 'center', mt: 1 }}>{COMPANY_ADDRESS}</Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            py: 1.25,
            mb: 1.5,
            borderBottom: '1px solid #d3d7dc'
          }}
        >
          <Typography
            component="h1"
            sx={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}
          >
            Payslip
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
            Division: {header.DIV_NAME || '—'}
          </Typography>
          <Button
            className="no-print"
            variant="outlined"
            size="small"
            onClick={() => navigate('/hr/Activity/Request/employee_payslip')}
          >
            Back to Search
          </Button>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            columnGap: 5,
            rowGap: 0.65,
            mb: 2.5
          }}
        >
          {[
            ['Employee Code', header.EMPLOYEE_CODE || header.EMPLOYEE_ID],
            ['Name', header.RPT_NAME],
            ['Designation', header.DESG_NAME],
            ['Division', header.DIV_NAME],
            ['Department', header.DEPT_NAME],
            ['Section', header.SECTION_NAME],
            ['Period', `${getMonthName(String(header.PAY_MONTH))} / ${header.PAY_YEAR}`],
            ['Currency', header.CURR_NAME],
            ['Bank Name', header.SALARY_BANK_CODE || header.MAIN_BANK],
            ['Account No.', header.SALARY_ACCT_NO],
            ['Mode of Payment', header.PAYMENT_MODE]
          ].map(([label, value]) => (
            <Box
              key={label}
              sx={{ display: 'grid', gridTemplateColumns: 'minmax(105px, 0.75fr) 1.25fr', gap: 1, fontSize: '0.78rem' }}
            >
              <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 700 }}>
                {label}
              </Typography>
              <Typography component="span" sx={{ fontSize: 'inherit', overflowWrap: 'anywhere' }}>
                : {value || '—'}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            border: '1px solid #333',
            '& > section:first-of-type': { borderRight: { xs: 0, sm: '1px solid #333' } }
          }}
        >
          {[
            { title: 'Earnings', items: earnings },
            { title: 'Deductions', items: deductions }
          ].map(({ title, items }) => (
            <Box component="section" key={title} sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  py: 0.7,
                  px: 1,
                  borderBottom: '1px solid #333',
                  textAlign: 'center',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}
              >
                {title}
              </Typography>
              <Box sx={{ minHeight: 120, p: 1 }}>
                {items.length > 0 ? (
                  items.map((item: any, index: number) => (
                    <Box
                      key={`${item.PAY_COMP_DESC}-${index}`}
                      sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.35, fontSize: '0.76rem' }}
                    >
                      <Typography sx={{ fontSize: 'inherit' }}>{item.PAY_COMP_DESC}</Typography>
                      <Typography sx={{ flexShrink: 0, fontSize: 'inherit', textAlign: 'right' }}>
                        {formatCurrency(item.PAY_COMP_AMT)}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.76rem' }}>
                    No {title.toLowerCase()} for this period
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
          <Box
            sx={{
              gridColumn: '1 / -1',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              borderTop: '1px solid #333'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, p: 1, fontSize: '0.76rem', fontWeight: 700 }}>
              <span>Gross Earnings</span>
              <span>{formatCurrency(grossEarnings)}</span>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 1,
                p: 1,
                fontSize: '0.76rem',
                fontWeight: 700,
                borderLeft: { xs: 0, sm: '1px solid #333' },
                borderTop: { xs: '1px solid #ddd', sm: 0 }
              }}
            >
              <span>Gross Deductions</span>
              <span>{formatCurrency(grossDeductions)}</span>
            </Box>
          </Box>
          <Box
            sx={{
              gridColumn: '1 / -1',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1,
              p: 1,
              borderTop: '1px solid #333',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            <span>Total Paid Salary:</span>
            <span>{header.CURR_NAME ? `${header.CURR_NAME} ` : ''}{formatCurrency(netSalary)}</span>
          </Box>
        </Box>

        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid #d3d7dc' }}>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, mb: 0.5 }}>
            Net Salary in Words
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
            {convertAmountToWords(netSalary, header.CURR_NAME)}
          </Typography>
        </Box>
        <Typography sx={{ mt: 2, textAlign: 'center', fontSize: '0.75rem' }}>This is a system generated salary slip. No signature required.</Typography>
      </Paper>
    </Container>
  );
};

export default BT_ViewPayslipReport;
