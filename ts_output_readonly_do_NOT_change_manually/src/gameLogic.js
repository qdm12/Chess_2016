var gameLogic;
(function (gameLogic) {
    function getInitialBoard() {
        return [
            ['BR', 'BN', 'BB', 'BQ', 'BK', 'BB', 'BN', 'BR'],
            ['BP', 'BP', 'BP', 'BP', 'BP', 'BP', 'BP', 'BP'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['WP', 'WP', 'WP', 'WP', 'WP', 'WP', 'WP', 'WP'],
            ['WR', 'WN', 'WB', 'WQ', 'WK', 'WB', 'WN', 'WR']
        ];
    }
    gameLogic.getInitialBoard = getInitialBoard;
    function getInitialState() {
        var delta = { deltaFrom: null, deltaTo: null,
            isUnderCheck: [false, false],
            canCastleKing: [true, true],
            canCastleQueen: [true, true],
            enpassantPosition: { row: null, col: null } };
        return { board: getInitialBoard(), delta: delta };
    }
    gameLogic.getInitialState = getInitialState;
    // Returns true if the game ended in a tie because there are no available moves for any pieces
    function isTie(board, turnIndex, isUnderCheck, canCastleKing, canCastleQueen, enpassantPosition) {
        if (isUnderCheck[turnIndex]) {
            return false;
        }
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                if (board[i][j] !== '' && board[i][j].charAt(0) === getTurn(turnIndex)) {
                    var curPos = { row: i, col: j };
                    switch (board[i][j].charAt(1)) {
                        case 'K':
                            if (canKingMoveAnywhere(board, turnIndex, curPos, isUnderCheck, canCastleKing, canCastleQueen)) {
                                return false;
                            }
                            break;
                        case 'Q':
                            if (canQueenMoveAnywhere(board, turnIndex, curPos)) {
                                return false;
                            }
                            break;
                        case 'R':
                            if (canRookMoveAnywhere(board, turnIndex, curPos)) {
                                return false;
                            }
                            break;
                        case 'B':
                            if (canBishopMoveAnywhere(board, turnIndex, curPos)) {
                                return false;
                            }
                            break;
                        case 'N':
                            if (canKnightMoveAnywhere(board, turnIndex, curPos)) {
                                return false;
                            }
                            break;
                        case 'P':
                            if (canPawnMoveAnywhere(board, turnIndex, curPos, enpassantPosition)) {
                                return false;
                            }
                            break;
                    }
                }
            }
        }
        return true;
    }
    // Returns the winner (either 'W' or 'B') or '' if there is no winner
    function getWinner(board, turnIndex, isUnderCheck, canCastleKing, canCastleQueen, enpassantPosition) {
        if (!isUnderCheck[turnIndex]) {
            return '';
        }
        var kingsPosition = findKingsPosition(board, turnIndex);
        // if there is no available moves for king
        if (!canKingMoveAnywhere(board, turnIndex, kingsPosition, isUnderCheck, canCastleKing, canCastleQueen)) {
            for (var i = 0; i < 8; i++) {
                for (var j = 0; j < 8; j++) {
                    var PieceEmpty = (board[i][j] === '');
                    var PieceTeam = board[i][j].charAt(0);
                    if (!PieceEmpty && PieceTeam === getTurn(turnIndex)) {
                        switch (board[i][j].charAt(1)) {
                            case 'Q':
                                if (canQueenMoveAnywhere(board, turnIndex, { row: i, col: j })) {
                                    return '';
                                }
                                break;
                            case 'R':
                                if (canRookMoveAnywhere(board, turnIndex, { row: i, col: j })) {
                                    return '';
                                }
                                break;
                            case 'B':
                                if (canBishopMoveAnywhere(board, turnIndex, { row: i, col: j })) {
                                    return '';
                                }
                                break;
                            case 'N':
                                if (canKnightMoveAnywhere(board, turnIndex, { row: i, col: j })) {
                                    return '';
                                }
                                break;
                            case 'P':
                                if (canPawnMoveAnywhere(board, turnIndex, { row: i, col: j }, enpassantPosition)) {
                                    return '';
                                }
                                break;
                        }
                    }
                }
            }
            // if we reached here then there is no piece to save the king
            return getOpponent(turnIndex);
        }
    }
    // Returns the move that should be performed when player givin a state
    function createMove(stateBeforeMove, turnIndex) {
        if (!stateBeforeMove) {
            stateBeforeMove = getInitialState();
        }
        var board = stateBeforeMove.board;
        var deltaFrom = stateBeforeMove.delta.deltaFrom;
        var deltaTo = stateBeforeMove.delta.deltaTo;
        var isUnderCheck = stateBeforeMove.delta.isUnderCheck;
        var canCastleKing = stateBeforeMove.delta.canCastleKing;
        var canCastleQueen = stateBeforeMove.delta.canCastleQueen;
        var enpassantPosition = stateBeforeMove.delta.enpassantPosition;
        if (!deltaFrom || !deltaTo) {
            throw new Error("Probably comes from checkmoveok which sends empty deltaFrom and deltaTo for some reason.");
        }
        if (deltaFrom.row === deltaTo.row && deltaFrom.col === deltaTo.col) {
            throw new Error("Cannot move to the same position.");
        }
        var PieceEmpty = (board[deltaTo.row][deltaTo.col] === '');
        var PieceTeam = board[deltaTo.row][deltaTo.col].charAt(0);
        if (!PieceEmpty && PieceTeam === getTurn(turnIndex)) {
            throw new Error("One can only make a move in an empty position or capture opponent's piece!");
        }
        if (getWinner(board, turnIndex, isUnderCheck, canCastleKing, canCastleQueen, enpassantPosition)
            ||
                isTie(board, turnIndex, isUnderCheck, canCastleKing, canCastleQueen, enpassantPosition)) {
            throw new Error("Can only make a move if the game is not over!");
        }
        var boardAfterMove = angular.copy(board), isUnderCheckAfterMove = angular.copy(isUnderCheck), canCastleKingAfterMove = angular.copy(canCastleKing), canCastleQueenAfterMove = angular.copy(canCastleQueen), enpassantPositionAfterMove = angular.copy(enpassantPosition);
        if (getTurn(turnIndex) !== board[deltaFrom.row][deltaFrom.col].charAt(0)) {
            throw new Error("Illegal to move this piece!");
        }
        // update the board according to the moving piece
        switch (board[deltaFrom.row][deltaFrom.col].charAt(1)) {
            case 'K':
                if (isCastlingKing(board, deltaFrom, deltaTo, turnIndex, canCastleKing)) {
                    boardAfterMove[deltaTo.row][deltaTo.col] = board[deltaFrom.row][deltaFrom.col];
                    boardAfterMove[deltaFrom.row][deltaFrom.col] = '';
                    boardAfterMove[deltaTo.row][deltaTo.col - 1] = getTurn(turnIndex) + 'R';
                    boardAfterMove[deltaTo.row][7] = '';
                    canCastleKingAfterMove[turnIndex] = false;
                    canCastleQueenAfterMove[turnIndex] = false;
                }
                else if (isCastlingQueen(board, deltaFrom, deltaTo, turnIndex, canCastleQueen)) {
                    boardAfterMove[deltaTo.row][deltaTo.col] = board[deltaFrom.row][deltaFrom.col];
                    boardAfterMove[deltaFrom.row][deltaFrom.col] = '';
                    boardAfterMove[deltaTo.row][deltaTo.col + 1] = getTurn(turnIndex) + 'R';
                    boardAfterMove[deltaTo.row][0] = '';
                    canCastleKingAfterMove[turnIndex] = false;
                    canCastleQueenAfterMove[turnIndex] = false;
                }
                else if (canKingMove(board, deltaFrom, deltaTo, turnIndex)) {
                    boardAfterMove[deltaTo.row][deltaTo.col] = board[deltaFrom.row][deltaFrom.col];
                    boardAfterMove[deltaFrom.row][deltaFrom.col] = '';
                }
                else {
                    throw new Error("Illegal move for king.");
                }
                break;
            case 'Q':
                if (canQueenMove(board, deltaFrom, deltaTo, turnIndex)) {
                    boardAfterMove[deltaTo.row][deltaTo.col] = board[deltaFrom.row][deltaFrom.col];
                    boardAfterMove[deltaFrom.row][deltaFrom.col] = '';
                }
                else {
                    throw new Error("Illegal move for Queen");
                }
                break;
            case 'R':
                if (canRookMove(board, deltaFrom, deltaTo, turnIndex)) {
                    boardAfterMove[deltaTo.row][deltaTo.col] = board[deltaFrom.row][deltaFrom.col];
                    boardAfterMove[deltaFrom.row][deltaFrom.col] = '';
                }
                else {
                    throw new Error("Illegal move for Rook");
                }
                break;
            case 'B':
                if (canBishopMove(board, deltaFrom, deltaTo, turnIndex)) {
                    boardAfterMove[deltaTo.row][deltaTo.col] = board[deltaFrom.row][deltaFrom.col];
                    boardAfterMove[deltaFrom.row][deltaFrom.col] = '';
                }
                else {
                    throw new Error("Illegal move for Bishop");
                }
                break;
            case 'N':
                if (canKnightMove(board, deltaFrom, deltaTo, turnIndex)) {
                    boardAfterMove[deltaTo.row][deltaTo.col] = board[deltaFrom.row][deltaFrom.col];
                    boardAfterMove[deltaFrom.row][deltaFrom.col] = '';
                }
                else {
                    throw new Error("Illegal move for Knight");
                }
                break;
            case 'P':
                if (canPawnMove(board, deltaFrom, deltaTo, turnIndex, enpassantPosition)) {
                    boardAfterMove[deltaTo.row][deltaTo.col] = board[deltaFrom.row][deltaFrom.col];
                    // capture the opponent pawn with enpassant
                    if (enpassantPosition.row &&
                        deltaFrom.row === enpassantPosition.row &&
                        deltaFrom.col !== deltaTo.col &&
                        (Math.abs(deltaFrom.col - enpassantPosition.col) === 1)) {
                        boardAfterMove[enpassantPosition.row][enpassantPosition.col] = '';
                    }
                    boardAfterMove[deltaFrom.row][deltaFrom.col] = '';
                    enpassantPositionAfterMove.row = null;
                    enpassantPositionAfterMove.col = null;
                    // check for enpassant
                    if (getTurn(turnIndex) === "W" && deltaTo.row === 4) {
                        if (boardAfterMove[deltaTo.row][deltaTo.col - 1] === "BP" ||
                            boardAfterMove[deltaTo.row][deltaTo.col + 1] === "BP") {
                            enpassantPositionAfterMove.row = deltaTo.row;
                            enpassantPositionAfterMove.col = deltaTo.col;
                        }
                    }
                    else if (getTurn(turnIndex) === "B" && deltaTo.row === 3) {
                        if (boardAfterMove[deltaTo.row][deltaTo.col - 1] === "WP" ||
                            boardAfterMove[deltaTo.row][deltaTo.col + 1] === "WP") {
                            enpassantPositionAfterMove.row = deltaTo.row;
                            enpassantPositionAfterMove.col = deltaTo.col;
                        }
                    }
                    // check for promotion
                    if (deltaTo.row === 0 || deltaTo.row === 7) {
                        var audio = new Audio('sounds/piece_promote.mp3');
                        audio.play();
                        boardAfterMove[deltaTo.row][deltaTo.col] = getTurn(turnIndex) + "Q"; //XXX eventually give choice later on
                    }
                }
                else {
                    throw new Error("Illegal move for Pawn");
                }
                break;
            default:
                throw new Error("Unknown piece type!");
        }
        turnIndex = 1 - turnIndex;
        if (isUnderCheckByPositions(boardAfterMove, turnIndex)) {
            isUnderCheckAfterMove[turnIndex] = true;
        }
        var winner = getWinner(boardAfterMove, turnIndex, isUnderCheckAfterMove, canCastleKingAfterMove, canCastleQueenAfterMove, enpassantPositionAfterMove);
        var endMatchScores;
        if (winner === 'W') {
            endMatchScores = [1, 0];
            turnIndex = -1;
        }
        else if (winner == 'B') {
            endMatchScores = [0, 1];
            turnIndex = -1;
        }
        else if (isTie(boardAfterMove, turnIndex, isUnderCheckAfterMove, canCastleKingAfterMove, canCastleQueenAfterMove, enpassantPositionAfterMove)) {
            endMatchScores = [0, 0];
            turnIndex = -1;
        }
        else {
            endMatchScores = null;
        }
        var delta = { deltaFrom: deltaFrom,
            deltaTo: deltaTo,
            isUnderCheck: isUnderCheckAfterMove,
            canCastleKing: canCastleKingAfterMove,
            canCastleQueen: canCastleQueenAfterMove,
            enpassantPosition: enpassantPositionAfterMove };
        var stateAfterMove = { delta: delta, board: boardAfterMove };
        return { endMatchScores: endMatchScores, turnIndexAfterMove: turnIndex, stateAfterMove: stateAfterMove };
    }
    gameLogic.createMove = createMove;
    function createInitialMove() {
        return { endMatchScores: null, turnIndexAfterMove: 0,
            stateAfterMove: getInitialState() };
    }
    gameLogic.createInitialMove = createInitialMove;
    function checkMoveOk(stateTransition) {
        // We can assume that turnIndexBeforeMove and stateBeforeMove are legal, and we need
        // to verify that the move is OK.
        var turnIndexBeforeMove = stateTransition.turnIndexBeforeMove;
        var stateBeforeMove = stateTransition.stateBeforeMove;
        var move = stateTransition.move;
        if (!stateBeforeMove && turnIndexBeforeMove === 0 &&
            angular.equals(createInitialMove(), move)) {
            return;
        }
        //XXX ERROR because deltaFrom and deltaTo in stateBeforeMove are null
        /*let expectedMove = createMove(stateBeforeMove, turnIndexBeforeMove);
        if (!angular.equals(move, expectedMove)) {
          throw new Error("Expected move=" + angular.toJson(expectedMove, true) +
              ", but got stateTransition=" + angular.toJson(stateTransition, true))
        }*/
    }
    gameLogic.checkMoveOk = checkMoveOk;
    function forSimpleTestHtml() {
        var move = gameLogic.createMove(null, 0); //XXX to change
        log.log("move=", move);
        var params = {
            turnIndexBeforeMove: 0,
            stateBeforeMove: null,
            move: move,
            numberOfPlayers: 2
        };
        gameLogic.checkMoveOk(params);
    }
    gameLogic.forSimpleTestHtml = forSimpleTestHtml;
    /* Returns all the possible moves for the given state and turnIndex.
     * Returns an empty array if the game is over. */
    function getPossibleMoves(board, turnIndex, isUnderCheck, canCastleKing, canCastleQueen, enpassantPosition) {
        if (!board) {
            return [];
        }
        var possibleMoves = [];
        var localpossibleMoves = [];
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                var PieceEmpty = (board[i][j] === '');
                var PieceTeam = board[i][j].charAt(0);
                if (!PieceEmpty && PieceTeam === getTurn(turnIndex)) {
                    var startPos = { row: i, col: j };
                    switch (board[i][j].charAt(1)) {
                        case 'K':
                            localpossibleMoves = getKingPossibleMoves(board, turnIndex, startPos, isUnderCheck, canCastleKing, canCastleQueen);
                            break;
                        case 'Q':
                            localpossibleMoves = getQueenPossibleMoves(board, turnIndex, startPos);
                            break;
                        case 'R':
                            localpossibleMoves = getRookPossibleMoves(board, turnIndex, startPos);
                            break;
                        case 'B':
                            localpossibleMoves = getBishopPossibleMoves(board, turnIndex, startPos);
                            break;
                        case 'N':
                            localpossibleMoves = getKnightPossibleMoves(board, turnIndex, startPos);
                            break;
                        case 'P':
                            localpossibleMoves = getPawnPossibleMoves(board, turnIndex, startPos, enpassantPosition);
                            break;
                    }
                    if (localpossibleMoves.length) {
                        possibleMoves.push([startPos, localpossibleMoves]);
                    }
                }
            }
        }
        return possibleMoves;
    }
    gameLogic.getPossibleMoves = getPossibleMoves;
    // Returns a list of positions available for king to move
    function getKingPossibleMoves(board, turnIndex, startPos, isUnderCheck, canCastleKing, canCastleQueen) {
        var destinations = [];
        // standard moves
        for (var i = startPos.row - 1; i < startPos.row + 2; i++) {
            for (var j = startPos.col - 1; j < startPos.col + 2; j++) {
                var curPos = { row: i, col: j };
                if (isOutOfBound(curPos)) {
                    continue;
                }
                var PieceEmpty = (board[i][j] === '');
                var PieceTeam = board[i][j].charAt(0);
                if (PieceEmpty || PieceTeam !== getTurn(turnIndex)) {
                    if (moveAndCheck(board, turnIndex, startPos, curPos)) {
                        destinations.push(curPos);
                    }
                }
            }
        }
        // casling moves
        if (!isUnderCheck[turnIndex]) {
            if (isCastlingKing(board, startPos, { row: startPos.row, col: startPos.col + 2 }, turnIndex, canCastleKing)) {
                destinations.push({ row: startPos.row, col: startPos.col + 2 });
            }
            if (isCastlingQueen(board, startPos, { row: startPos.row, col: startPos.col - 2 }, turnIndex, canCastleQueen)) {
                destinations.push({ row: startPos.row, col: startPos.col - 2 });
            }
        }
        return destinations;
    }
    gameLogic.getKingPossibleMoves = getKingPossibleMoves;
    // Returns true if the conditions of castle to king side satisfied
    function isCastlingKing(board, deltaFrom, deltaTo, turnIndex, canCastleKing) {
        var caslingRow = 0;
        if (getTurn(turnIndex) === 'W') {
            caslingRow = 7;
        }
        if (isPositionUnderAttack(board, turnIndex, deltaFrom)) {
            return false;
        }
        if (canCastleKing[turnIndex] &&
            deltaFrom.row === caslingRow &&
            deltaFrom.col === 4 &&
            deltaTo.col - deltaFrom.col === 2) {
            for (var j = 5; j <= 6; j++) {
                if (board[deltaFrom.row][j] !== '') {
                    return false;
                }
                if (isPositionUnderAttack(board, turnIndex, { row: deltaFrom.row, col: j })) {
                    return false;
                }
            }
            return board[caslingRow][7] === getTurn(turnIndex) + 'R';
        }
        return false;
    }
    // Returns true if the conditions of castle to queen side satisfied
    function isCastlingQueen(board, deltaFrom, deltaTo, turnIndex, canCastleQueen) {
        var caslingRow = 0;
        if (getTurn(turnIndex) === 'W') {
            caslingRow = 7;
        }
        if (isPositionUnderAttack(board, turnIndex, deltaFrom)) {
            return false;
        }
        if (canCastleQueen[turnIndex] &&
            deltaFrom.row === caslingRow &&
            deltaFrom.col === 4 &&
            deltaFrom.col - deltaTo.col === 2) {
            for (var j = 1; j < 4; j++) {
                if (board[deltaFrom.row][j] !== '') {
                    return false;
                }
                if (isPositionUnderAttack(board, turnIndex, { row: deltaFrom.row, col: j })) {
                    return false;
                }
            }
            return board[caslingRow][0] === getTurn(turnIndex) + 'R';
        }
        return false;
    }
    // Returns true if the deltaTo is available for king to move
    function canKingMove(board, deltaFrom, deltaTo, turnIndex) {
        if (isOutOfBound(deltaTo)) {
            return false;
        }
        var PieceEmpty = (board[deltaTo.row][deltaTo.col] === '');
        var PieceTeam = board[deltaTo.row][deltaTo.col].charAt(0);
        if (!PieceEmpty && PieceTeam !== getTurn(turnIndex)) {
            return false;
        }
        for (var i = deltaFrom.row - 1; i < deltaFrom.row + 2; i++) {
            for (var j = deltaFrom.col - 1; j < deltaFrom.col + 2; j++) {
                if (isOutOfBound({ row: i, col: j })) {
                    continue;
                }
                if (i === deltaTo.row && j === deltaTo.col) {
                    return moveAndCheck(board, turnIndex, deltaFrom, deltaTo);
                }
            }
        }
        return false;
    }
    // Returns true if the king has any place to move
    function canKingMoveAnywhere(board, turnIndex, startPos, isUnderCheck, canCastleKing, canCastleQueen) {
        // standard moves
        for (var i = startPos.row - 1; i < startPos.row + 2; i++) {
            for (var j = startPos.col - 1; j < startPos.col + 2; j++) {
                var curPos = { row: i, col: j };
                if (isOutOfBound(curPos)) {
                    continue;
                }
                var PieceEmpty = (board[i][j] === '');
                var PieceTeam = board[i][j].charAt(0);
                if (!PieceEmpty && PieceTeam !== getTurn(turnIndex)) {
                    if (moveAndCheck(board, turnIndex, startPos, curPos)) {
                        return true;
                    }
                }
            }
        }
        // casling moves
        if (!isUnderCheck[turnIndex]) {
            if (isCastlingKing(board, startPos, { row: startPos.row, col: startPos.col + 2 }, turnIndex, canCastleKing)) {
                return true;
            }
            if (isCastlingQueen(board, startPos, { row: startPos.row, col: startPos.col - 2 }, turnIndex, canCastleQueen)) {
                return true;
            }
        }
        return false;
    }
    // Returns true if the current player's king is under check
    function isUnderCheckByPositions(board, turnIndex) {
        var kingsPosition = findKingsPosition(board, turnIndex);
        return isPositionUnderAttack(board, turnIndex, kingsPosition);
    }
    // Returns true if the position is under attack by any opponent pieces
    function isPositionUnderAttack(board, turnIndex, position) {
        var attPositions = [];
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                var PieceEmpty = (board[i][j] === '');
                var PieceTeam = board[i][j].charAt(0);
                if (!PieceEmpty && PieceTeam !== getTurn(turnIndex)) {
                    var curPos = { row: i, col: j };
                    switch (board[i][j].charAt(1)) {
                        case 'K':
                            if (canKingMove(board, curPos, position, 1 - turnIndex)) {
                                return true;
                            }
                            break;
                        case 'Q':
                            if (canQueenMove(board, curPos, position, 1 - turnIndex)) {
                                return true;
                            }
                            break;
                        case 'R':
                            if (canRookMove(board, curPos, position, 1 - turnIndex)) {
                                return true;
                            }
                            break;
                        case 'B':
                            if (canBishopMove(board, curPos, position, 1 - turnIndex)) {
                                return true;
                            }
                            break;
                        case 'N':
                            if (canKnightMove(board, curPos, position, 1 - turnIndex)) {
                                return true;
                            }
                            break;
                        case 'P':
                            if (canPawnMove(board, curPos, position, 1 - turnIndex, null)) {
                                return true;
                            }
                            break;
                    }
                }
            }
        }
    }
    // Returns the position of the current player's king
    function findKingsPosition(board, turnIndex) {
        var kingPiece = getTurn(turnIndex) + "K";
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                if (board[i][j] === kingPiece) {
                    return { row: i, col: j };
                }
            }
        }
        throw new Error("Your king is missing and the game should end!");
    }
    // Returns true if queen can move from deltaFrom to deltaTo
    function canQueenMove(board, deltaFrom, deltaTo, turnIndex) {
        return canRookMove(board, deltaFrom, deltaTo, turnIndex) ||
            canBishopMove(board, deltaFrom, deltaTo, turnIndex);
    }
    // Returns true if the queen has any place to move
    function canQueenMoveAnywhere(board, turnIndex, startPos) {
        return canRookMoveAnywhere(board, turnIndex, startPos) ||
            canBishopMoveAnywhere(board, turnIndex, startPos);
    }
    // Returns all available positions for queen to move
    function getQueenPossibleMoves(board, turnIndex, startPos) {
        return getRookPossibleMoves(board, turnIndex, startPos).concat(getBishopPossibleMoves(board, turnIndex, startPos));
    }
    gameLogic.getQueenPossibleMoves = getQueenPossibleMoves;
    // Returns true if the rook can move from deltaFrom to deltaTo
    function canRookMove(board, deltaFrom, deltaTo, turnIndex) {
        if (isOutOfBound(deltaTo)) {
            return false;
        }
        var endPieceEmpty = (board[deltaTo.row][deltaTo.col] === '');
        var endPieceTeam = board[deltaTo.row][deltaTo.col].charAt(0);
        if (!endPieceEmpty && endPieceTeam === getTurn(turnIndex)) {
            return false;
        }
        if (deltaFrom.row === deltaTo.row) {
            if (deltaFrom.col === deltaTo.col) {
                return false;
            }
            var col1 = deltaTo.col + 1;
            var col2 = deltaFrom.col;
            if (deltaFrom.col < deltaTo.col) {
                col1 = deltaFrom.col + 1;
                col2 = deltaTo.col;
            }
            for (var i = col1; i < col2; i++) {
                if (board[deltaFrom.row][i] !== '') {
                    return false;
                }
            }
            return moveAndCheck(board, turnIndex, deltaFrom, deltaTo);
        }
        else if (deltaFrom.col === deltaTo.col) {
            if (deltaFrom.row === deltaTo.row) {
                return false;
            }
            var row1 = deltaTo.row + 1;
            var row2 = deltaFrom.row;
            if (deltaFrom.row < deltaTo.row) {
                row1 = deltaFrom.row + 1;
                row2 = deltaTo.row;
            }
            for (var i = row1; i < row2; i++) {
                if (board[i][deltaFrom.col] !== '') {
                    return false;
                }
            }
            return moveAndCheck(board, turnIndex, deltaFrom, deltaTo);
        }
        else {
            return false;
        }
    }
    // Returns true if the rook has any place to move
    function canRookMoveAnywhere(board, turnIndex, startPos) {
        for (var i = 1; i < 8; i++) {
            var endPos1 = { row: startPos.row + i, col: startPos.col }, endPos2 = { row: startPos.row - i, col: startPos.col }, endPos3 = { row: startPos.row, col: startPos.col + i }, endPos4 = { row: startPos.row, col: startPos.col - i };
            if (canRookMove(board, startPos, endPos1, turnIndex)) {
                return true;
            }
            if (canRookMove(board, startPos, endPos2, turnIndex)) {
                return true;
            }
            if (canRookMove(board, startPos, endPos3, turnIndex)) {
                return true;
            }
            if (canRookMove(board, startPos, endPos4, turnIndex)) {
                return true;
            }
        }
        return false;
    }
    // Returns all available positions for rook to move
    function getRookPossibleMoves(board, turnIndex, startPos) {
        var toPos = [];
        for (var i = 1; i < 8; i++) {
            var endPos1 = { row: startPos.row + i, col: startPos.col }, endPos2 = { row: startPos.row - i, col: startPos.col }, endPos3 = { row: startPos.row, col: startPos.col + i }, endPos4 = { row: startPos.row, col: startPos.col - i };
            if (canRookMove(board, startPos, endPos1, turnIndex)) {
                toPos.push(endPos1);
            }
            if (canRookMove(board, startPos, endPos2, turnIndex)) {
                toPos.push(endPos2);
            }
            if (canRookMove(board, startPos, endPos3, turnIndex)) {
                toPos.push(endPos3);
            }
            if (canRookMove(board, startPos, endPos4, turnIndex)) {
                toPos.push(endPos4);
            }
        }
        return toPos;
    }
    gameLogic.getRookPossibleMoves = getRookPossibleMoves;
    // Returns true if the bishop can move from deltaFrom to deltaTo
    function canBishopMove(board, deltaFrom, deltaTo, turnIndex) {
        if (isOutOfBound(deltaTo)) {
            return false;
        }
        var endPieceEmpty = (board[deltaTo.row][deltaTo.col] === '');
        var endPieceTeam = board[deltaTo.row][deltaTo.col].charAt(0);
        if (!endPieceEmpty && endPieceTeam === getTurn(turnIndex)) {
            return false;
        }
        var diffRow = Math.abs(deltaFrom.row - deltaTo.row);
        var diffCol = Math.abs(deltaFrom.col - deltaTo.col);
        if ((!diffRow && !diffCol) || (diffRow !== diffCol)) {
            return false;
        }
        else {
            for (var i = 1; i < diffRow; i++) {
                var cell = '';
                var col = deltaFrom.col - i;
                if (deltaFrom.col < deltaTo.col) {
                    col = deltaFrom.col + i;
                }
                if (deltaFrom.row < deltaTo.row) {
                    cell = board[deltaFrom.row + i][col];
                }
                else {
                    cell = board[deltaFrom.row - i][col];
                }
                if (cell !== '') {
                    return false;
                }
            }
            return moveAndCheck(board, turnIndex, deltaFrom, deltaTo);
        }
    }
    // Returns true if the rook has any place to move
    function canBishopMoveAnywhere(board, turnIndex, startPos) {
        for (var i = 1; i < 8; i++) {
            var endPos1 = { row: startPos.row - i, col: startPos.col - i }, endPos2 = { row: startPos.row - i, col: startPos.col + i }, endPos3 = { row: startPos.row + i, col: startPos.col - i }, endPos4 = { row: startPos.row + i, col: startPos.col + i };
            if (canBishopMove(board, startPos, endPos1, turnIndex)) {
                return true;
            }
            if (canBishopMove(board, startPos, endPos2, turnIndex)) {
                return true;
            }
            if (canBishopMove(board, startPos, endPos3, turnIndex)) {
                return true;
            }
            if (canBishopMove(board, startPos, endPos4, turnIndex)) {
                return true;
            }
        }
        return false;
    }
    // Returns the list of available positions for bishop to move
    function getBishopPossibleMoves(board, turnIndex, startPos) {
        var toPos = [];
        for (var i = 1; i < 8; i++) {
            var endPos1 = { row: startPos.row - i, col: startPos.col - i }, endPos2 = { row: startPos.row - i, col: startPos.col + i }, endPos3 = { row: startPos.row + i, col: startPos.col - i }, endPos4 = { row: startPos.row + i, col: startPos.col + i };
            if (canBishopMove(board, startPos, endPos1, turnIndex)) {
                toPos.push(endPos1);
            }
            if (canBishopMove(board, startPos, endPos2, turnIndex)) {
                toPos.push(endPos2);
            }
            if (canBishopMove(board, startPos, endPos3, turnIndex)) {
                toPos.push(endPos3);
            }
            if (canBishopMove(board, startPos, endPos4, turnIndex)) {
                toPos.push(endPos4);
            }
        }
        return toPos;
    }
    gameLogic.getBishopPossibleMoves = getBishopPossibleMoves;
    // Returns true if the knight can move from deltaFrom to deltaTo
    function canKnightMove(board, deltaFrom, deltaTo, turnIndex) {
        if (isOutOfBound(deltaTo)) {
            return false;
        }
        var endPieceEmpty = (board[deltaTo.row][deltaTo.col] === '');
        var endPieceTeam = board[deltaTo.row][deltaTo.col].charAt(0);
        if (!endPieceEmpty && endPieceTeam === getTurn(turnIndex)) {
            return false;
        }
        var diffRow = Math.abs(deltaFrom.row - deltaTo.row);
        var diffCol = Math.abs(deltaFrom.col - deltaTo.col);
        if (diffRow === 2 && diffCol === 1) {
            return moveAndCheck(board, turnIndex, deltaFrom, deltaTo);
        }
        else if (diffRow === 1 && diffCol === 2) {
            return moveAndCheck(board, turnIndex, deltaFrom, deltaTo);
        }
        return false;
    }
    // Returns true if the knight has any place available to move
    function canKnightMoveAnywhere(board, turnIndex, startPos) {
        for (var i = startPos.row - 2; i < startPos.row + 3; i++) {
            if (i === startPos.row) {
                continue;
            }
            for (var j = startPos.col - 2; j < startPos.col + 3; j++) {
                if (j === startPos.col) {
                    continue;
                }
                var endPos = { row: i, col: j };
                if (canKnightMove(board, startPos, endPos, turnIndex)) {
                    return true;
                }
            }
        }
        return false;
    }
    // Returns the list of available positions for knight to move
    function getKnightPossibleMoves(board, turnIndex, startPos) {
        var toPos = [];
        for (var i = startPos.row - 2; i < startPos.row + 3; i++) {
            if (i === startPos.row) {
                continue;
            }
            for (var j = startPos.col - 2; j < startPos.col + 3; j++) {
                if (j === startPos.col) {
                    continue;
                }
                var endPos = { row: i, col: j };
                if (canKnightMove(board, startPos, endPos, turnIndex)) {
                    toPos.push(endPos);
                }
            }
        }
        return toPos;
    }
    gameLogic.getKnightPossibleMoves = getKnightPossibleMoves;
    // Returns true if the pawn can move from deltaFrom to deltaTo
    function canPawnMove(board, deltaFrom, deltaTo, turnIndex, enpassantPosition) {
        if (isOutOfBound(deltaTo)) {
            return false;
        }
        var endPieceEmpty = (board[deltaTo.row][deltaTo.col] === '');
        var endPieceTeam = board[deltaTo.row][deltaTo.col].charAt(0);
        if (!endPieceEmpty && endPieceTeam === getTurn(turnIndex)) {
            return false;
        }
        // check if is first move with two squares
        var diffRow = Math.abs(deltaFrom.row - deltaTo.row);
        var diffCol = Math.abs(deltaFrom.col - deltaTo.col);
        if ((diffRow === 2 &&
            endPieceEmpty &&
            deltaFrom.col === deltaTo.col &&
            deltaFrom.row === (getTurn(turnIndex) === "W" ? 6 : 1) &&
            board[(deltaFrom.row > deltaTo.row ? deltaFrom.row : deltaTo.row) - 1][deltaTo.col] === '') || (diffRow === 1 &&
            endPieceEmpty &&
            deltaFrom.col === deltaTo.col) || (diffRow === 1 &&
            diffCol === 1 &&
            endPieceTeam !== getTurn(turnIndex) &&
            !endPieceEmpty) || (diffRow === 1 &&
            diffCol === 1 &&
            endPieceEmpty &&
            enpassantPosition &&
            enpassantPosition.row &&
            enpassantPosition.col &&
            deltaFrom.row === enpassantPosition.row &&
            Math.abs(deltaFrom.col - enpassantPosition.col) === 1)) {
            return moveAndCheck(board, turnIndex, deltaFrom, deltaTo);
        }
        return false;
    }
    // Returns true if the pawn has any place available to move
    function canPawnMoveAnywhere(board, turnIndex, startPos, enpassantPosition) {
        var endPos = { row: 0, col: 0 };
        var blackTurn = (getTurn(turnIndex) === 'B');
        //standard move
        if (blackTurn) {
            endPos.row = startPos.row + 1;
        }
        else {
            endPos.row = startPos.row - 1;
        }
        for (var i = startPos.col - 1; i <= startPos.col + 1; i++) {
            if (i < 0 || i > 7) {
                continue;
            }
            endPos.col = i;
            if (canPawnMove(board, startPos, endPos, turnIndex, enpassantPosition)) {
                return true;
            }
        }
        //Starting move of 2 cells
        if (startPos.row === (blackTurn ? 1 : 6)) {
            endPos.col = startPos.col;
            if (blackTurn) {
                endPos.row++;
            }
            else {
                endPos.row--;
            }
            if (canPawnMove(board, startPos, endPos, turnIndex, enpassantPosition)) {
                return true;
            }
        }
        return false;
    }
    // Returns the list of available positions for pawn to move
    function getPawnPossibleMoves(board, turnIndex, startPos, enpassantPosition) {
        var toPos = [];
        var endPos = { row: 0, col: 0 };
        var blackTurn = (getTurn(turnIndex) === 'B');
        //standard move
        if (blackTurn) {
            endPos.row = startPos.row + 1;
        }
        else {
            endPos.row = startPos.row - 1;
        }
        for (var i = startPos.col - 1; i <= startPos.col + 1; i++) {
            if (i < 0 || i > 7) {
                continue;
            }
            endPos.col = i;
            if (canPawnMove(board, startPos, endPos, turnIndex, enpassantPosition)) {
                //console.log("found one: from "+startPos.row+","+startPos.col+" to "+endPos.row+","+endPos.col);
                toPos.push({ row: endPos.row, col: endPos.col }); //enpassant move and regular
            }
        }
        //Starting move of 2 cells
        if (startPos.row === (blackTurn ? 1 : 6)) {
            endPos.col = startPos.col;
            if (blackTurn) {
                endPos.row++;
            }
            else {
                endPos.row--;
            }
            if (canPawnMove(board, startPos, endPos, turnIndex, enpassantPosition)) {
                toPos.push(endPos);
            }
        }
        return toPos;
    }
    // Returns true if you can actually move the piece (check condition)
    function moveAndCheck(board, turnIndex, startPos, endPos) {
        if (board[endPos.row][endPos.col] === getOpponent(turnIndex) + 'K') {
            return true;
        }
        var boardAfterMove = angular.copy(board);
        boardAfterMove[endPos.row][endPos.col] = boardAfterMove[startPos.row][startPos.col];
        boardAfterMove[startPos.row][startPos.col] = '';
        if (isUnderCheckByPositions(boardAfterMove, turnIndex)) {
            return false;
        }
        return true;
    }
    // Returns opponent initial
    function getOpponent(turnIndex) {
        if (turnIndex === 0) {
            return 'B';
        }
        return 'W';
    }
    // Returns turnIndex initial
    function getTurn(turnIndex) {
        if (turnIndex === 0) {
            return 'W';
        }
        return 'B';
    }
    function isOutOfBound(pos) {
        if (pos.row < 0 || pos.col < 0 || pos.row > 7 || pos.col > 7) {
            return true;
        }
        return false;
    }
})(gameLogic || (gameLogic = {}));
//# sourceMappingURL=gameLogic.js.map