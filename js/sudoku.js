if (Sudoku === undefined) {
  var Sudoku = {};
  console.log('Sudoku defined');
}

Sudoku.Game = {
  CellValue: (function () {
    let cellValue = function (value) {
      this.value = value;
      this.cellValueDiv = document.createElement('div');
      this.cellValueDiv.className = 'cellvalue';
      this.cellValueDiv.textContent = value;
    };
    return cellValue;
  })(),

  Cell: (function () {
    let cell = function (grid, row, col, section, possibles) {
      this.grid = grid;
      this.row = row;
      this.col = col;
      this.section = section;
      this.cellValues = [];
      this.cellDiv = document.createElement('div');
      this.cellDiv.className = 'cell';
      if (col === 2 || col === 5) this.cellDiv.classList.add('cellborderright');
      else if (col === 3 || col === 6)
        this.cellDiv.classList.add('cellborderleft');
      if (row === 2 || row === 5)
        this.cellDiv.classList.add('cellborderbottom');
      else if (row === 3 || row === 6)
        this.cellDiv.classList.add('cellbordertop');
      for (let i = 1; i <= possibles; i++) {
        this.cellValues.push(new Sudoku.Game.CellValue(i));
        this.cellDiv.appendChild(this.cellValues[i - 1].cellValueDiv);
      }

      let thisCell = this;
      this.cellDiv.addEventListener(
        'click',
        function () {
          if (thisCell.cellDiv.childElementCount > 1) {
            let input = document.createElement('input');
            input.className = 'cellinput';
            input.addEventListener('beforeinput', (event) => {
              if (
                event.data === null ||
                event.data === ' ' ||
                isNaN(event.data)
              ) {
                if (event.data === null || event.data === ' ') {
                  input.blur();
                  thisCell.reset();
                  thisCell.grid.reset();
                } else {
                  event.preventDefault();
                }
              } else {
                const value = parseInt(event.data, 10);
                if (thisCell.getValidValues().includes(value)) {
                  input.blur();
                  thisCell.setValue(value);
                  thisCell.grid.refresh();
                } else {
                  event.preventDefault();
                }
              }

              //   let keycode = event.which;
              //   if (
              //     !(
              //       event.shiftKey == false &&
              //       (keycode == 46 || (keycode >= 49 && keycode <= 57))
              //     )
              //   ) {
              //     event.preventDefault();
              //   } else {
              //     thisCell.cellDiv.textContent = '';
              //     thisCell.cellValues.forEach((cellValue) =>
              //       thisCell.cellDiv.appendChild(cellValue.cellValueDiv)
              //     );
              //     if (keycode === 46) {
              //       thisCell.reset();
              //       thisCell.grid.reset();
              //     } else {
              //       let value = event.keyCode - 48;
              //       if (thisCell.getValidValues().includes(value)) {
              //         thisCell.setValue(value);
              //         thisCell.grid.refresh();
              //       }
              //     }
              //   }
            });
            input.addEventListener('focusout', (event) => {
              thisCell.cellDiv.textContent = '';
              thisCell.cellValues.forEach((cellValue) =>
                thisCell.cellDiv.appendChild(cellValue.cellValueDiv)
              );
            });
            thisCell.cellDiv.textContent = '';
            thisCell.cellDiv.appendChild(input);
            input.focus();
          }
        },
        false
      );
    };

    let reset = function () {
      this.cellValues.forEach((cellValue) => {
        cellValue.cellValueDiv.classList.remove('cellentered');
        cellValue.cellValueDiv.classList.remove('cellfound');
        cellValue.cellValueDiv.textContent = cellValue.value;
      });
    };

    let setValue = function (value) {
      this.setValidValues([value]);
      this.cellValues.forEach((cellValue) => {
        if (cellValue.value === value) {
          cellValue.cellValueDiv.classList.add('cellentered');
        }
      });
    };

    let getValidValues = function () {
      let validCells = [];
      let validValues = [];
      this.cellValues.forEach((cellValue) => {
        if (cellValue.cellValueDiv.textContent !== '') {
          validValues.push(cellValue.value);
          validCells.push(cellValue);
        }
      });
      if (validCells.length === 1)
        validCells[0].cellValueDiv.classList.add('cellfound');
      return validValues;
    };

    let setValidValues = function (validValues) {
      let changed = false;
      this.cellValues.forEach((cellValue) => {
        if (
          !validValues.includes(cellValue.value) &&
          cellValue.cellValueDiv.textContent !== ''
        ) {
          changed = true;
          cellValue.cellValueDiv.classList.remove('cellentered');
          cellValue.cellValueDiv.textContent = '';
        }
      });
      if (changed) this.grid.gridCheck();
      if (changed && this.getValidValues().length === 0) console.log('ERROR');
      return changed;
    };

    let setInvalidValues = function (invalidValues) {
      let changed = false;
      this.cellValues.forEach((cellValue) => {
        if (
          invalidValues.includes(cellValue.value) &&
          cellValue.cellValueDiv.textContent !== ''
        ) {
          changed = true;
          cellValue.cellValueDiv.classList.remove('cellentered');
          cellValue.cellValueDiv.textContent = '';
        }
      });
      if (changed) this.grid.gridCheck();
      if (changed && this.getValidValues().length === 0) console.log('ERROR');
      return changed;
    };

    cell.prototype = {
      reset: reset,
      setValue: setValue,
      getValidValues: getValidValues,
      setValidValues: setValidValues,
      setInvalidValues: setInvalidValues,
    };
    return cell;
  })(),

  Grid: (function () {
    let grid = function (board, size) {
      this.gridSize = size * size;
      this.sectionSize = size;
      this.possibleValues = size * size;
      this.cells = [];
      for (let row = 0; row < this.gridSize; row++)
        for (let col = 0; col < this.gridSize; col++) {
          let section = parseInt(row / size) * size + parseInt(col / size);
          let cell = new Sudoku.Game.Cell(
            this,
            row,
            col,
            section,
            this.possibleValues
          );
          this.cells.push(cell);
          board.appendChild(cell.cellDiv);
        }
    };

    let refresh = function () {
      let changed = false;
      do {
        changed = false;
        for (let size = 1; size <= 3; size++) {
          this.cells.forEach((cell) => {
            let validValues = cell.getValidValues();
            let combinations = this.getCombinations(validValues, size);
            combinations.forEach((combination) => {
              changed =
                this.checkCombinations(
                  combination,
                  this.getRowCells(cell.row),
                  false
                ) || changed;
              changed =
                this.checkCombinations(
                  combination,
                  this.getColCells(cell.col),
                  false
                ) || changed;
              changed =
                this.checkCombinations(
                  combination,
                  this.getSectionCells(cell.section),
                  true
                ) || changed;
              changed =
                this.checkABCCombination(cell, validValues, combination) ||
                changed;
            });
          });
        }
      } while (changed);
      this.cells.forEach((cell) => cell.getValidValues());
    };

    ///
    // this method basically checks a grid pattern of 4 cells, where the cells form the points of
    // a rectangle and 3 of the cells contain the a combination of values ABC with AB, BC, AC which
    // means the remaining cell cannot have the value A
    ///
    let checkABCCombination = function (cell, validValues, combination) {
      if (combination.length === 2 && validValues.length === 2) {
        let pairs = [
          [validValues[0], validValues[1]],
          [validValues[1], validValues[0]],
        ];
        for (let i = 0; i < pairs.length; i++) {
          for (let row = 0; row < this.gridSize; row++) {
            if (row !== cell.row) {
              let rowCell = this.cells[row * this.gridSize + cell.col];
              let rowCellValues = rowCell.getValidValues();
              if (
                rowCellValues.length === 2 &&
                rowCellValues.includes(pairs[i][0])
              ) {
                for (let col = 0; col < this.gridSize; col++) {
                  if (col !== cell.col) {
                    let colCell = this.cells[cell.row * this.gridSize + col];
                    let colCellValues = colCell.getValidValues();
                    if (
                      colCellValues.length === 2 &&
                      colCellValues.includes(pairs[i][1])
                    ) {
                      let rowCellValue = 0;
                      for (let x = 0; x < 2 && rowCellValue === 0; x++)
                        if (rowCellValues[x] !== pairs[i][0])
                          rowCellValue = rowCellValues[x];
                      let colCellValue = 0;
                      for (let x = 0; x < 2 && colCellValue === 0; x++)
                        if (colCellValues[x] !== pairs[i][1])
                          colCellValue = colCellValues[x];
                      if (rowCellValue === colCellValue) {
                        return this.cells[
                          rowCell.row * this.gridSize + colCell.col
                        ].setInvalidValues([rowCellValue]);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      return false;
    };

    ///
    // This method checks the cells passed in for the combination of values
    // passed in. For example, if the combination values has 2 values, and
    // those values only exist in 2 cells, then all other cells cannot have
    // those values. This method basically attempts to reduce the possible
    // values on the cells based on the combination passed in
    ///
    let checkCombinations = function (combination, cells, isSectionBased) {
      let matchingCells = [];
      let containingCells = [];
      let containingSomeCells = [];
      for (let i = 0; i < cells.length; i++) {
        let cell = cells[i];
        let validValues = cell.getValidValues();
        let found = 0;
        combination.forEach((value) => {
          if (validValues.includes(value)) found++;
        });
        if (found === combination.length || found === validValues.length) {
          containingCells.push(cell);
          if (
            validValues.length == combination.length ||
            found === validValues.length
          )
            matchingCells.push(cell);
        } else if (found > 0) {
          containingSomeCells.push(cell);
        }
      }
      let changed = false;
      if (matchingCells.length === combination.length) {
        cells.forEach((cell) => {
          if (!matchingCells.includes(cell))
            changed = cell.setInvalidValues(combination) || changed;
        });
      } else if (
        containingCells.length == combination.length &&
        containingSomeCells.length === 0
      ) {
        cells.forEach((cell) => {
          if (containingCells.includes(cell))
            changed = cell.setValidValues(combination) || changed;
          else changed = cell.setInvalidValues(combination) || changed;
        });
      } else if (!isSectionBased && containingSomeCells.length === 0) {
        let containingSections = [];
        let containingRows = [];
        let containingCols = [];
        containingCells.forEach((cell) => {
          if (!containingSections.includes(cell.section))
            containingSections.push(cell.section);
          if (!containingRows.includes(cell.row)) containingRows.push(cell.row);
          if (!containingCols.includes(cell.col)) containingCols.push(cell.col);
        });
        if (containingSections.length === 1) {
          if (containingRows.length === 1) {
            this.cells.forEach((cell) => {
              if (
                (cell.row === containingRows[0] &&
                  cell.section != containingSections[0]) ||
                (cell.row !== containingRows[0] &&
                  cell.section === containingSections[0])
              )
                changed = cell.setInvalidValues(combination) || changed;
            });
          } else if (containingCols.length == 1) {
            this.cells.forEach((cell) => {
              if (
                (cell.col === containingCols[0] &&
                  cell.section != containingSections[0]) ||
                (cell.col !== containingCols[0] &&
                  cell.section === containingSections[0])
              )
                changed = cell.setInvalidValues(combination) || changed;
            });
          }
        }
      }
      return changed;
    };

    let combinationUtil = function (
      source,
      result,
      data,
      start,
      end,
      index,
      size
    ) {
      if (index === size) {
        result.push([...data]);
      } else {
        for (let i = start; i <= end && end - i + 1 >= size - index; i++) {
          data[index] = source[i];
          this.combinationUtil(
            source,
            result,
            data,
            i + 1,
            end,
            index + 1,
            size
          );
        }
      }
    };

    let getCombinations = function (source, size) {
      let combinations = [];
      let data = [];
      this.combinationUtil(
        source,
        combinations,
        data,
        0,
        source.length - 1,
        0,
        size
      );
      return combinations;
    };

    let getRowCells = function (row) {
      let cells = [];
      this.cells.forEach((cell) => {
        if (cell.row == row) cells.push(cell);
      });
      return cells;
    };

    let getColCells = function (col) {
      let cells = [];
      this.cells.forEach((cell) => {
        if (cell.col == col) cells.push(cell);
      });
      return cells;
    };

    let getSectionCells = function (section) {
      let cells = [];
      this.cells.forEach((cell) => {
        if (cell.section == section) cells.push(cell);
      });
      return cells;
    };

    let setCell = function (row, col, value) {
      this.cells[row * this.gridSize + col].setValue(value);
      // this.cells.forEach( cell => {
      //     if( cell.row === row && cell.col === col ) {
      //         cell.setValue(value);
      //         return;
      //     }
      // });
    };

    let reset = function () {
      this.cells.forEach((cell) => {
        let manuallyEntered = false;
        cell.cellValues.forEach((cellValue) => {
          if (cellValue.cellValueDiv.classList.contains('cellentered'))
            manuallyEntered = true;
        });
        if (!manuallyEntered) cell.reset();
      });
      this.refresh();
    };

    let resetAll = function () {
      this.cells.forEach((cell) => {
        cell.reset();
      });
    };

    let gridCheck = function () {
      let errors = false;
      for (let row = 0; row < this.gridSize; row++)
        errors = cellsCheck(this.getRowCells(row)) || errors;
      for (let col = 0; col < this.gridSize; col++)
        errors = cellsCheck(this.getColCells(col)) || errors;
      for (let sect = 0; sect < this.gridSize; sect++)
        errors = cellsCheck(this.getSectionCells(sect)) || errors;
      return errors;
    };

    let cellsCheck = function (cells) {
      let errors = false;
      let values = [];
      cells.forEach((cell) => {
        let cellValues = cell.getValidValues();
        if (cellValues.length === 1)
          if (values.includes(cellValues[0])) {
            errors = true;
            console.log('Error on cell at: ' + cell.row + ',' + cell.col);
          } else {
            values.push(cellValues[0]);
          }
      });
      return errors;
    };

    grid.prototype = {
      gridCheck: gridCheck,
      cellsCheck: cellsCheck,
      reset: reset,
      resetAll: resetAll,
      setCell: setCell,
      getRowCells: getRowCells,
      getColCells: getColCells,
      getSectionCells: getSectionCells,
      refresh: refresh,
      checkABCCombination: checkABCCombination,
      checkCombinations: checkCombinations,
      combinationUtil: combinationUtil,
      getCombinations: getCombinations,
    };

    return grid;
  })(),
};
