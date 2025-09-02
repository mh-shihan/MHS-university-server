const academicSemesterStartEndMonths = (academicSemesterName: string) => {
  switch (academicSemesterName) {
    case 'Spring':
      return { startMonth: 'January', endMonth: 'April' };
    case 'Summer':
      return { startMonth: 'May', endMonth: 'August' };
    case 'Fall':
      return { startMonth: 'September', endMonth: 'December' };
    default:
      return {};
  }
};

export default academicSemesterStartEndMonths;
