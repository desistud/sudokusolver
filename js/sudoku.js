if( Sudoku === undefined) {
    var Sudoku = {};
    console.log("Sudoku defined");
}

Sudoku.Game = {
    CellValue : (function(){
        let cellValue = function(value){
            this.value = value;
            this.cellValueDiv = document.createElement('div');
            this.cellValueDiv.className = 'cellvalue';
            this.cellValueDiv.textContent = value;
        }
        return cellValue;
    })(),

    Cell : (function(){
        let cell = function(grid,row,col,section,possibles){
            this.grid = grid;
            this.row = row;
            this.col = col;
            this.section = section;
            this.cellValues = [];
            this.cellDiv = document.createElement('div');
            this.cellDiv.className = 'cell';
            if( col === 2 || col === 5 )
                this.cellDiv.classList.add('cellborderright');
            else if( col === 3 || col === 6 )
                this.cellDiv.classList.add('cellborderleft');
            if( row === 2 || row === 5 )
                this.cellDiv.classList.add('cellborderbottom');
            else if( row === 3 || row === 6 )
                this.cellDiv.classList.add('cellbordertop');
            for( let i=1; i<=possibles; i++)
            {
                this.cellValues.push( new Sudoku.Game.CellValue(i));
                this.cellDiv.appendChild(this.cellValues[i-1].cellValueDiv);
            }
            
            let thisCell = this;
            this.cellDiv.addEventListener('click', function(){
                if( thisCell.cellDiv.childElementCount > 1 )
                {
                    let input = document.createElement('input');
                    input.className = 'cellinput';
                    input.addEventListener('keydown', event => {
                        let keycode = event.which;
                        if (!(event.shiftKey == false && (keycode == 46 || (keycode >= 49 && keycode <= 57)))) {
                            event.preventDefault();
                        }
                        else {
                            thisCell.cellDiv.textContent = '';
                            thisCell.cellValues.forEach(cellValue => thisCell.cellDiv.appendChild(cellValue.cellValueDiv));
                            if( keycode === 46 ){
                                thisCell.reset();
                                thisCell.grid.reset();
                            }
                            else {
                                let value = event.keyCode-48;
                                if( thisCell.getValidValues().includes(value)){
                                    thisCell.setValue(value);
                                    thisCell.grid.refresh();
                                }
                            }
                        }
                    });
                    input.addEventListener('focusout', event => {
                        thisCell.cellDiv.textContent = '';
                        thisCell.cellValues.forEach(cellValue => thisCell.cellDiv.appendChild(cellValue.cellValueDiv));
                    });
                    thisCell.cellDiv.textContent = '';
                    thisCell.cellDiv.appendChild(input);
                    input.focus();
                }
            }, false)
        };

        let reset = function(){
            this.cellValues.forEach( cellValue => {
                cellValue.cellValueDiv.classList.remove('cellentered');
                cellValue.cellValueDiv.classList.remove('cellfound');
                cellValue.cellValueDiv.textContent = cellValue.value;
            });
        }

        let setValue = function(value){
            this.setValidValues([value]);
            this.cellValues.forEach( cellValue => {
                if( cellValue.value === value ){
                    cellValue.cellValueDiv.classList.add('cellentered');
                }
            });
        };

        let getValidValues = function(){
            let validCells = [];
            let validValues = [];
            this.cellValues.forEach( cellValue => {
                if( cellValue.cellValueDiv.textContent !== ''){
                    validValues.push(cellValue.value);
                    validCells.push(cellValue);
                }
            });
            if( validCells.length === 1)
                validCells[0].cellValueDiv.classList.add('cellfound');
            return validValues;
        };

        let setValidValues = function(validValues){
            let changed = false;
            this.cellValues.forEach( cellValue => {
                if( !validValues.includes(cellValue.value) && cellValue.cellValueDiv.textContent !== '' )
                {
                    changed = true;
                    cellValue.cellValueDiv.classList.remove('cellentered');
                    cellValue.cellValueDiv.textContent = '';
                }
            });
            return changed;
        };

        let setInvalidValues = function(invalidValues){
            let changed = false;
            this.cellValues.forEach( cellValue => {
                if( invalidValues.includes(cellValue.value) && cellValue.cellValueDiv.textContent !== '' )
                {
                    changed = true;
                    cellValue.cellValueDiv.classList.remove('cellentered');
                    cellValue.cellValueDiv.textContent = '';
                }
            });
            return changed;
        };

        cell.prototype = {
            reset : reset,
            setValue : setValue,
            getValidValues : getValidValues,
            setValidValues : setValidValues,
            setInvalidValues : setInvalidValues,
        }
        return cell;
    })(),

    Grid : (function() {
        let grid = function(board, size){
            this.gridSize = size*size;
            this.sectionSize = size;
            this.possibleValues = size*size;
            this.cells = [];
            for( let row=0; row<this.gridSize; row ++ )
                for( let col=0; col<this.gridSize; col++)
                {
                    let section = parseInt(row/size)*size + parseInt(col/size);
                    let cell = new Sudoku.Game.Cell(this,row,col,section,this.possibleValues);
                    this.cells.push(cell);
                    board.appendChild(cell.cellDiv);
                }
        };

        let refresh = function(){
            let changed = false;
            do{
                changed = false;
                for( let size=1; size<=3; size++) {
                    this.cells.forEach( cell => {
                        let validValues = cell.getValidValues();
                        //if( validValues.length > 1 )
                        {
                            let combinations = this.getCombinations( validValues, size);
                            combinations.forEach( combination => {
                                changed = this.checkCombinations(combination, this.getRowCells(cell.row)) || changed;
                                changed = this.checkCombinations(combination, this.getColCells(cell.col)) || changed;
                                changed = this.checkCombinations(combination, this.getSectionCells(cell.section)) || changed;
                            });
                        }
                    });
                }
                for( let section=1; section<=this.gridSize; section++){
                    changed = this.checkSection(this.getSectionCells(section), this.cells) || changed;
                }
            } while(changed);
            this.cells.forEach( cell => cell.getValidValues() );
        };

        ////
        // This method performs a check by checking if a value can only exits
        // within row/col in a section. If so then that value cannot exist on
        // that same row/col in the other secions
        ///
        let checkSection = function(section, cells){
            let changed = false;
            for( let value=1; value<=9; value++){
                let containingCells = [];
                let containingCols = [];
                let containingRows = [];
                section.forEach( sectionCell => {
                    if(sectionCell.getValidValues().includes(value)){
                        containingCells.push(sectionCell);
                        if(!containingRows.includes(sectionCell.row))
                            containingRows.push(sectionCell.row);
                        if(!containingCols.includes(sectionCell.col))
                            containingCols.push(sectionCell.col);
                    }
                });
                if(containingCells.length > 1){
                    if(containingRows.length === 1){
                        cells.forEach( cell => {
                            if( cell.row === containingRows[0] && cell.section !== containingCells[0].section)
                                changed = cell.setInvalidValues([value]) || changed;
                        });
                    }
                    else if( containingCols.length === 1){
                        cells.forEach( cell => {
                            if( cell.col === containingCols[0] && cell.section !== containingCells[0].section)
                                changed = cell.setInvalidValues([value]) || changed;
                        });
                    }
                }
            }
            return changed;
        };

        ///
        // This method checks the cells passed in for the combination of values
        // passed in. For example, if the combination values has 2 values, and
        // those values only exist in 2 cells, then all other cells cannot have
        // those values. This method basically attempts to reduce the possible
        // values on the cells based on the combination passed in
        ///
        let checkCombinations = function( combination, cells )
        {
            let matchingCells = [];
            let containingCells = [];
            let containingSomeCells = [];
            for( let i=0; i<cells.length; i++){
                let cell = cells[i];
                let validValues = cell.getValidValues();
                let found = 0;
                combination.forEach( value => {
                    if(validValues.includes(value))
                        found++;
                });
                if(found === combination.length || found === validValues.length)
                {
                    containingCells.push(cell);
                    if( validValues.length == combination.length || found === validValues.length )
                        matchingCells.push(cell);
                }
                else if( found > 0 ){
                    containingSomeCells.push(cell);
                }
            };
            let changed = false;
            if( matchingCells.length === combination.length )
            {
                cells.forEach( cell => {
                    if( !matchingCells.includes(cell) )
                        changed = cell.setInvalidValues(combination) || changed;
                });
            }
            else if( containingCells.length == combination.length && containingSomeCells.length === 0 )
            {
                cells.forEach( cell => {
                    if( containingCells.includes(cell) )
                        changed = cell.setValidValues(combination) || changed;
                    else
                        changed = cell.setInvalidValues(combination) || changed;
                });
            }
            return changed;
        }

        let combinationUtil = function(source, result, data, start, end, index, size){
            if( index === size ){
                result.push([...data]);
            } else {
                for( let i=start; i<=end && end-i+1 >= size-index; i++ )
                {
                    data[index] = source[i];
                    this.combinationUtil( source, result, data, i+1, end, index+1, size);
                }
            }
        };

        let getCombinations = function(source,size){
            let combinations = [];
            let data = [];
            this.combinationUtil(source,combinations,data,0,source.length-1,0,size);
            return combinations;
        };

        let getRowCells = function(row){
            let cells = [];
            this.cells.forEach( cell => {
                if( cell.row == row )
                    cells.push(cell);
            });
            return cells;
        };

        let getColCells = function(col){
            let cells = [];
            this.cells.forEach( cell => {
                if( cell.col == col )
                    cells.push(cell);
            });
            return cells;
        };

        let getSectionCells = function(section){
            let cells = [];
            this.cells.forEach( cell => {
                if( cell.section == section )
                    cells.push(cell);
            });
            return cells;
        };

        let setCell = function(row,col,value){
            this.cells.forEach( cell => {
                if( cell.row === row && cell.col === col ) {
                    cell.setValue(value);
                    return;
                }
            });
        }

        let reset = function(){
            this.cells.forEach( cell => {
                let manuallyEntered = false;
                cell.cellValues.forEach( cellValue => {
                    if( cellValue.cellValueDiv.classList.contains('cellentered'))
                        manuallyEntered = true;
                });
                if(!manuallyEntered)
                    cell.reset();
            });
            this.refresh();
        };

        let resetAll = function(){
            this.cells.forEach( cell => {
                    cell.reset();
            });
        };

        grid.prototype = {
            reset : reset,
            resetAll : resetAll,
            setCell : setCell,
            getRowCells : getRowCells,
            getColCells : getColCells,
            getSectionCells : getSectionCells,
            refresh : refresh,
            checkSection : checkSection,
            checkCombinations : checkCombinations,
            combinationUtil : combinationUtil,
            getCombinations : getCombinations,
        };

        return grid;
    })(),
}