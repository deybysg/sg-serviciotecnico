import Swal from 'sweetalert2';

// Configure default SweetAlert2 options for modern styling
Swal.mixin({
  customClass: {
    popup: 'swal-modern-popup',
    title: 'swal-modern-title',
    content: 'swal-modern-content',
    confirmButton: 'swal-modern-confirm',
    cancelButton: 'swal-modern-cancel',
    denyButton: 'swal-modern-deny',
    icon: 'swal-modern-icon',
    input: 'swal-modern-input',
    closeButton: 'swal-modern-close',
    validationMessage: 'swal-modern-validation',
    actions: 'swal-modern-actions',
    footer: 'swal-modern-footer'
  },
  buttonsStyling: true,
  heightAuto: false,
  showClass: {
    popup: 'swal-modern-show'
  },
  hideClass: {
    popup: 'swal-modern-hide'
  }
});

// Configure default Toast options with modern animation
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
  showClass: {
    popup: 'swal-toast-show'
  },
  hideClass: {
    popup: 'swal-toast-hide'
  }
});

export { Toast };
export default Swal;
