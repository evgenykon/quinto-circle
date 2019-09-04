const Colors = {
    default: '#303030',
    font: '#ffffff',
    selected: '#f52424',
    referenced: '#444050',
    mystic: '#809bbd',
    hover: '#444857'
  };
  const Sections = {
    inner: {
      chords: ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'Ebm', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'],
      selected: [],
      referenced: [],
      mystic: []
    },
    outer: {
      chords: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'],
      selected: [],
      referenced: [],
      mystic: []
    }
  };
  const Utils = {
    getChords: (circle) => {
      return Sections[circle].chords;
    },
    getBgColors: (circle) => {
      let result = [];
      for (let i in Sections[circle].chords) {
        i = parseInt(i);
        let isSelected = Sections[circle].selected.indexOf(i);
        let isReferenced = Sections[circle].referenced.indexOf(i);
        let isMystic = Sections[circle].mystic.indexOf(i);
        let color = Colors.default;
        if (isSelected > -1) {
          color = Colors.selected;
        } else if (isReferenced > -1) {
          color = Colors.referenced;
        } else if (isMystic > -1) {
          color = Colors.mystic;
        }
        result.push(color);
      }
      return result;
    },
    getData: (circle) => {
      return {
        datasets: [{ 
          data: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 
          backgroundColor: Utils.getBgColors(circle),
          hoverBackgroundColor: Colors.hover
        }],
        labels: Utils.getChords(circle)
      };
    },
    sectionClick: (e, item) => {
      const zitem = item[0];
      const elemIndex = zitem._index;
      const chartIndex = zitem._chart.id;
      const circle = chartIndex === 0 ? 'outer' : 'inner';
      let isSelected = Sections[circle].selected.indexOf(elemIndex);
      let isReferenced = Sections[circle].referenced.indexOf(elemIndex);
      let isMystic = Sections[circle].mystic.indexOf(elemIndex);
      if (isSelected > -1) {
        Sections[circle].selected.splice(isSelected, 1);
        Sections[circle].referenced.push(elemIndex);
      } else if (isReferenced > -1) {
        Sections[circle].referenced.splice(isReferenced, 1);
        Sections[circle].mystic.push(elemIndex);
      } else if (isMystic > -1) {
        Sections[circle].mystic.splice(isMystic, 1);
      } else {
        Sections[circle].selected.push(elemIndex);
      }
      const data = Utils.getData(circle);
      if (circle === 'inner') {
        window.innerChart.data = data;
        window.innerChart.update();
      } else if (circle === 'outer') {
        window.outerChart.data = data;
        window.outerChart.update();
      }
      console.debug(Sections);
    }
  };
  
  const options = {
    legend: false,
    tooltips: false,
    cutoutPercentage: 70,
    rotation: -0.585 * Math.PI,
    animation: {animateRotate: false},
    plugins: {labels: {render: 'label', fontColor: Colors.font}},
    'onClick' : Utils.sectionClick,
  };

  document.addEventListener('DOMContentLoaded', () => {
        import('chart.js').then(() => {
            import('chartjs-plugin-labels').then(() => {
                const options2 = Object.assign({}, options);
                options2.cutoutPercentage = 60;
              
                window.outerChart = new Chart("circle", {type: "pie", data: Utils.getData('outer'), options: options});
                window.innerChart = new Chart("innercircle", {type: "pie", data: Utils.getData('inner'), options: options2});
            });
        
        });
  });
  

