document.addEventListener('DOMContentLoaded', () => {
  const addButton = document.getElementById('addMovieButton');
  const modelOverlay = document.getElementById('movieModel');
  const cancelButton = document.getElementById('cancelmodel');
  const form = document.querySelector('.movie-form');
  const gridAddButton = document.getElementById('gridAddButton');

  // Show the form when "add movie" is clicked
  addButton?.addEventListener('click', () => {
    modelOverlay.classList.remove('hidden');
  });

  // show the form when "add movie" card is clicked
  gridAddButton?.addEventListener('click', () => {
    modelOverlay.classList.remove('hidden');
  });

  cancelButton?.addEventListener('click', () => {
    modelOverlay.classList.add('hidden');
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    modelOverlay.classList.add('hidden');
  });

  // rating system
  const ratingContainers = document.querySelectorAll('.rating');
  ratingContainers.forEach((container) => {
    const stars = container.querySelectorAll('.star');
    let selectedValue = 0;

    // update the selected stars based on the current selected value
    function updateSelected() {
      stars.forEach((star, index) => {
        if (index < selectedValue) {
          star.classList.add('selected');
        } else {
          star.classList.remove('selected');
        }
      });
    }

    stars.forEach((star, index) => {
      // highlighting
      star.addEventListener('mouseenter', () => {
        stars.forEach((s, i) => {
          if (i <= index) {
            s.classList.add('hover');
          } else {
            s.classList.remove('hover');
          }
        });
      });

      // remove highlight when leaving a star
      star.addEventListener('mouseleave', () => {
        stars.forEach((s) => s.classList.remove('hover'));
        updateSelected();
      });

      // persist on click
      star.addEventListener('click', () => {
        selectedValue = index + 1;
        container.dataset.selected = selectedValue.toString();
        updateSelected();
      });
    });
  });
});