const CargoSizes = {
    S: 0,
    M: 1,
    L: 2,
    XL: 3
}

const CargoLengths = [1, 2, 2, 2]
const CargoHeights = [1, 1, 2, 3]
const CargoVolumes = [1, 2, 4, 6]

const CargoSizeStrings = [
    "S",
    "M",
    "L",
    "XL"
]

function isNumberIllegal(number) {
    if (!Number.isSafeInteger(number) || number <= 0) {
        throw new Error(`Illegal number: ${number}`)
    }
}

function weightToString(weight) {
    var weight_int = weight / 10
    var weight_dec = weight - weight_int * 10
    return `${weight_int}.${weight_dec}kg`

}

class Cargo {
    static width = 1
    constructor(size, weight) {
        switch (size) {
            case CargoSizes.S:
            case CargoSizes.M:
            case CargoSizes.L:
            case CargoSizes.XL:
                break
            default:
                throw new Error(`Size ileegal: ${size}`)
        }
        isNumberIllegal(weight)
        this.size = size
        this.weight = weight
        this.length = CargoLengths[size]
        this.height = CargoHeights[size]
        this.volume = CargoVolumes[size]
    }

    getWeightString() {
        return weightToString(this.weight)
    }
}

const MaterialTypes = {
    Resins: 0,
    Metals: 1,
    Ceramics: 2,
    Chemicals: 3,
    SpecialAlloys: 4
}

const MaterialTypeStrings = [
    "Resins",
    "Metals",
    "Ceramics",
    "Chemicals",
    "Special Alloys"
]

const MaterialBaseQuantities = [
    40, 50, 40, 30, 60
]

const MaterialQuantities = [
    [ 40, 80, 160, 320, 480, 640, 800 ],
    [ 50, 100, 200, 400, 600, 800, 1000 ],
    [ 40, 80, 160, 320, 480, 640, 800 ],
    [ 30, 60, 120, 240, 360, 480, 600 ],
    [ 60, 120, 240, 480, 720, 960, 1200 ]
]

const MaterialSizes = [
    CargoSizes.S,
    CargoSizes.M,
    CargoSizes.L,
    CargoSizes.XL,
    CargoSizes.XL,
    CargoSizes.XL,
    CargoSizes.XL
]

function isMaterialTypeIllegal(type) {
    switch (type) {
        case MaterialTypes.Resins:
        case MaterialTypes.Metals:
        case MaterialTypes.Ceramics:
        case MaterialTypes.Chemicals:
        case MaterialTypes.SpecialAlloys:
            break
        default:
            throw new Error(`Illegal material type: ${type}`)
    }
}

class Material extends Cargo {
    static density = 1
    constructor(type, quantityNeeded) {
        isMaterialTypeIllegal(type)
        isNumberIllegal(quantityNeeded)
        var quantityId = 0
        var quantity = 0
        for (; quantityId < 7; ++quantityId) {
            quantity = MaterialQuantities[type][quantityId]
            if (quantity >= quantityNeeded) {
                break
            }
        }
        if (quantityId == 7) {
            quantityId = 6
        }
        const size = MaterialSizes[quantityId]
        super(size, quantity  * Material.density)
        this.type = type
        this.quantityId = quantityId
        this.quantity = quantity
    }
}

class MaterialRequest {
    constructor(type, quantityNeeded) {
        isMaterialTypeIllegal(type)
        isNumberIllegal(quantityNeeded)
        var materials = []
        var material
        var lastQuantity = 0
        while (quantityNeeded) {
            material = new Material(type, quantityNeeded)
            materials.push(material)
            lastQuantity = material.quantity
            if (lastQuantity >= quantityNeeded) {
                break
            }
            quantityNeeded -= lastQuantity
        }
        if (materials.length == 0) {
            throw new Error("No materials identified, this should not happen")
        }
        var weight = 0
        var volume = 0
        for (const material of materials) {
            weight += material.weight
            volume += material.volume
        }
        this.type = type
        this.quantity = quantityNeeded
        this.materials = materials
        this.weight = weight
        this.volume = volume
    }

    getWeightString() {
        return weightToString(this.weight)
    }

    #getDescribeCommon() {
        var cargos = [ 0, 0, 0, 0, 0, 0, 0 ]
        for (const material of this.materials) {
            ++cargos[material.quantityId]
        }
        return cargos
    }

    getDescribeParagraph() {
        const quantities = MaterialQuantities[this.type]
        const cargos = this.#getDescribeCommon()
        var lines = []
        for (var i = 0; i < 7; ++i) {
            if (cargos[i]) {
                lines.push(`${MaterialTypeStrings[this.type]} (${quantities[i]}) * ${cargos[i]}`)
            }
        }
        return lines.join("<br>")
    }

    fillList(cellList) {
        cellList.textContent = ''
        const quantities = MaterialQuantities[this.type]
        const cargos = this.#getDescribeCommon()
        var start = false
        for (var i = 0; i < 7; ++i) {
            if (cargos[i]) {
                if (start) {
                    const nodeBr = document.createElement('br')
                    cellList.appendChild(nodeBr)
                } else {
                    start = true
                }
                const nodeText = document.createTextNode(`${MaterialTypeStrings[this.type]} (${quantities[i]}) * ${cargos[i]}`)
                cellList.appendChild(nodeText)
            }
        }

    }

    getDescribeNode() {
        const listAll = document.createTextNode('')
    }
}

class TableSummary {
    constructor() {
        const rowResins = document.getElementById('trResins')
        if (rowResins == null) {
            throw new Error("Failed to get row of Resins in summary")
        }
        const rowMetals = document.getElementById('trMetals')
        if (rowMetals == null) {
            throw new Error("Failed to get row of Metals in summary")
        }
        const rowCeramics = document.getElementById('trCeramics')
        if (rowCeramics == null) {
            throw new Error("Failed to get row of Ceramics in summary")
        }
        const rowChemicals = document.getElementById('trChemicals')
        if (rowChemicals == null) {
            throw new Error("Failed to get row of Chemicals in summary")
        }
        const rowSpecialAlloys = document.getElementById('trSpecialAlloys')
        if (rowSpecialAlloys == null) {
            throw new Error("Failed to get row of Special Alloys in summary")
        }
        this.rows = [
            rowResins,
            rowMetals,
            rowCeramics,
            rowChemicals,
            rowSpecialAlloys
        ]
    }

    updateFromCargos(cargos) { // cargos[5][7]
        for (var i = 0; i < 5; ++i) {
            for (var j = 0; j < 7; ++j) {
                if (cargos[i][j] > 0) {
                    this.rows[i].children[j+1].textContent = cargos[i][j]
                } else {
                    this.rows[i].children[j+1].textContent = ''
                }
            }
        }
    }
}

const tableSummary = new TableSummary()

function inputEnterCallback(event) {
    if (event.key == "Enter") {
        event.preventDefault()
        tableRequests.inputEnterConfirm()
    }
}

class RowEditting {
    constructor(row, cellID, cellType, cellQuantity, cellTotal, cellList, cellWeight, cellVolume, cellAction, cellSelect) {
        this.row = row
        this.cellID = cellID
        this.cellType = cellType
        this.selectType = cellType.firstChild
        this.cellQuantity = cellQuantity
        this.inputQuantity = cellQuantity.firstChild
        this.cellTotal = cellTotal
        this.inputTotal = cellTotal.firstChild
        this.cellList = cellList
        this.cellWeight = cellWeight
        this.cellVolume = cellVolume
        this.cellAction = cellAction
        this.buttonConfirm = cellAction.firstChild
        this.cellSelect = cellSelect
        this.inputSelect = cellSelect.firstChild
        this.inputQuantity.focus()
    }

    inputEnterConfirm() {
        this.buttonConfirm.click()
    }

    confirmRequest() {
        const quantityString = this.inputQuantity.value
        if (quantityString == "") {
            alert("The needed/added quantity must NOT be empty!")
            return null
        }
        var quantity = Number(quantityString)
        if (!Number.isSafeInteger(quantity) || quantity < 0) {
            alert("The needed/added quantity must be a valid non-negative integer!")
            return null
        }
        const totalString = this.inputTotal.value
        if (totalString == "") {
            if (quantity == 0) {
                alert("The total quantity must NOT be empty when added quantity is 0!")
                return null
            }
        } else {
            const total = Number(totalString)
            if (!Number.isSafeInteger(total) || total < 0) {
                alert("The total quantity must be a valid non-negative integer!")
                return null
            }
            if (total > quantity) {
                quantity = total - quantity
            } else {
                alert("The total quantity must be greater than added quantity!")
                return null
            }
        }
        const typeString = this.selectType.value
        var type
        for (type = 0; type < 5; ++type) {
            if (MaterialTypeStrings[type] == typeString) {
                break
            }
        }
        if (type == 5) {
            throw new Error("Failed to find request type")
        }
        const request = new MaterialRequest(type, quantity)
        this.cellType.textContent = typeString
        this.cellQuantity.textContent = quantityString
        this.cellTotal.textContent = totalString
        request.fillList(this.cellList)
        this.cellWeight.textContent = request.getWeightString()
        this.cellVolume.textContent = request.volume
        this.cellAction.textContent = ''
        const buttonEdit = document.createElement('button')
        buttonEdit.textContent = 'Edit'
        buttonEdit.setAttribute('onclick', 'tableRequests.editRequestCallback(this)')
        const id = Number(this.cellID.textContent)
        if (id >= 1 && id <= 9 ) {
            const nodeIEditShortcut = document.createElement('i')
            nodeIEditShortcut.textContent = ` (shift+${id})`
            nodeIEditShortcut.setAttribute('class', 'iHotkeyHints')
            buttonEdit.appendChild(nodeIEditShortcut)
        }
        this.cellAction.appendChild(buttonEdit)
        return request
    }
}

const NumberToShifted = [
    ')', '!', '@', '#', '$', '%', '^', '&', '*', '('
]

const ShiftedToNumber = {
    '!': 1,
    '@': 2,
    '#': 3,
    '$': 4,
    '%': 5,
    '^': 6,
    '&': 7,
    '*': 8,
    '(': 9,
    ')': 0
}

class TableRequests {
    constructor() {
        const table = document.getElementById('tbRequests')
        if (table == null) {
            throw new Error('Failed to find table')
        }
        const divAddRequest = document.getElementById('divAddRequest')
        if (divAddRequest == null) {
            throw new Error('Failed to find div add request')
        }
        this.table = table
        this.divAddRequest = divAddRequest
        this.requests = []
        this.rowEditting = null
        this.editting = false
        // this.holdingCtrl = false
        this.setupHotkeys()
    }

    setupHotkeys() {
        const buttonResins = document.getElementById('btResins')
        const buttonMetals = document.getElementById('btMetals')
        const buttonCeramics = document.getElementById('btCeramics')
        const buttonChemicals = document.getElementById('btChemicals')
        const buttonSpecialAlloys = document.getElementById('btSpecialAlloys')
        const buttonClearRequests = document.getElementById('btClearRequests')
        const buttonSelectAll = document.getElementById('btSelectAll')
        const buttonUnselectAll = document.getElementById('btUnselectAll')
        const buttonDeleteSelected = document.getElementById('btDeleteSelected')
        if (buttonResins == null) {
            throw new Error('Failed to find button to create Resins request')
        }
        if (buttonMetals == null) {
            throw new Error('Failed to find button to create Metals request')
        }
        if (buttonCeramics == null) {
            throw new Error('Failed to find button to create Ceramics request')
        }
        if (buttonChemicals == null) {
            throw new Error('Failed to find button to create Chemicals request')
        }
        if (buttonSpecialAlloys == null) {
            throw new Error('Failed to find button to create Special Alloys request')
        }
        if (buttonClearRequests == null) {
            throw new Error('Failed to find button to clear all requests')
        }
        if (buttonSelectAll == null) {
            throw new Error('Failed to find button to select all requests')
        }
        if (buttonUnselectAll == null) {
            throw new Error('Failed to find button to unselect all request')
        }
        if (buttonDeleteSelected == null) {
            throw new Error('Failed to find button to delete selected requests')
        }
        const self = this
        document.onkeyup = function(event) {
            // if (event.key == 'Control') {
            //     self.holdingCtrl = false
            // }
            if (self.editting) return
            switch (event.key) {
                case 'R':
                case 'r':
                    buttonResins.click()
                    break
                case 'M':
                case 'm':
                    buttonMetals.click()
                    break
                case 'C':
                    buttonCeramics.click()
                    break
                case 'c':
                    buttonChemicals.click()
                    break
                case 'S':
                case 's':
                    buttonSpecialAlloys.click()
                    break
                case 'Z':
                case 'z':
                    buttonClearRequests.click()
                    break
                case 'A':
                case 'a':
                    buttonSelectAll.click()
                    break
                case 'U':
                case 'u':
                    buttonUnselectAll.click()
                    break
                case 'D':
                case 'd':
                    buttonDeleteSelected.click()
                    break
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    self.selectRequest(Number(event.key))
                    break
                case '!':
                case '@':
                case '#':
                case '$':
                case '%':
                case '^':
                case '&':
                case '*':
                case '(':
                    self.editRequest(ShiftedToNumber[event.key], true)
                    break
            }
        }
        // document.onkeydown = function(event) {
        //     if (event.key == 'Control') {
        //         self.holdingCtrl = true
        //     }
        //     if (self.editting) return
        // }
    }

    lockRequests() {
        for (const row of this.table.children) {
            for (const button of row.children[7].children) {
                button.setAttribute('disabled', '')
            }
            row.lastChild.firstChild.setAttribute('disabled', '')
        }
    }

    unlockRequests() {
        for (const row of this.table.children) {
            for (const button of row.children[7].children) {
                button.removeAttribute('disabled')
            }
            row.lastChild.firstChild.removeAttribute('disabled')
        }
    }

    hideNewRequest() {
        this.divAddRequest.setAttribute('hidden', '')
    }

    unhideNewRequest() {
        this.divAddRequest.removeAttribute('hidden')
    }

    beginEdit() {
        this.editting = true
        this.lockRequests()
        this.hideNewRequest()
    }

    endEdit() {
        this.unlockRequests()
        this.unhideNewRequest()
        this.editting = false
    }

    setInputQuantities(cellQuantity, value, isTotal) {
        const input = document.createElement('input')
        input.setAttribute('class', 'inputQuantities')
        input.setAttribute('type', 'number')
        input.setAttribute('min', '0')
        input.setAttribute('onkeypress', 'return (event.charCode !=8 && event.charCode ==0 || (event.charCode >= 48 && event.charCode <= 57))')
        input.addEventListener('keypress', inputEnterCallback)
        if (isTotal) {
            input.setAttribute('id', 'inputTotal')
            input.setAttribute('placeholder', 'optional')
        } else {
            input.setAttribute('id', 'inputQuantity')
        }
        if (value != "") {
            input.value = value
        }
        cellQuantity.appendChild(input)
    }

    fillCellType(cellType, type) {
        const nodeType = document.createElement('select')
        for (var i = 0; i < 5; ++i) {
            const nodeOption = document.createElement('option')
            const nodeText = document.createTextNode(MaterialTypeStrings[i])
            nodeOption.appendChild(nodeText)
            if (i == type) {
                nodeOption.setAttribute('selected', '')
            }
            nodeType.appendChild(nodeOption)
        }
        cellType.appendChild(nodeType)
    }

    fillCellActionConfirm(cellAction) {
        const nodeConfirm = document.createElement('button')
        const nodeText = document.createTextNode('Confirm ')
        const nodeTextHotkey = document.createElement('i')
        nodeTextHotkey.textContent = '(Enter)'
        nodeTextHotkey.setAttribute('class', 'iHotkeyHints')
        nodeConfirm.appendChild(nodeText)
        nodeConfirm.appendChild(nodeTextHotkey)
        nodeConfirm.setAttribute('id', 'btConfirm')
        nodeConfirm.setAttribute('onclick', 'tableRequests.confirmRequest()')
        cellAction.appendChild(nodeConfirm)
    }

    newRequest(type) {
        isMaterialTypeIllegal(type)
        this.beginEdit()

        const row = this.table.insertRow()

        const cellID = row.insertCell()
        cellID.textContent = this.requests.length + 1

        const cellType = row.insertCell()
        this.fillCellType(cellType, type)

        const cellQuantity = row.insertCell()
        this.setInputQuantities(cellQuantity, "", false)

        const cellTotal = row.insertCell()
        this.setInputQuantities(cellTotal, "", true)

        const cellList = row.insertCell()
        cellList.textContent = '...'

        const cellWeight = row.insertCell()
        cellWeight.textContent = '...'

        const cellVolume = row.insertCell()
        cellVolume.textContent = '...'

        const cellAction = row.insertCell()
        this.fillCellActionConfirm(cellAction)

        const cellSelect = row.insertCell()
        const nodeSelect = document.createElement('input')
        nodeSelect.setAttribute('type', 'checkbox')
        nodeSelect.setAttribute('name', 'cbRequest')
        nodeSelect.setAttribute('disabled', '')
        cellSelect.appendChild(nodeSelect)
        if (this.requests.length < 9) {
            const nodeISelectShortcut = document.createElement('i')
            nodeISelectShortcut.textContent = ` (${this.requests.length + 1})`
            nodeISelectShortcut.setAttribute('class', 'iHotkeyHints')
            cellSelect.appendChild(nodeISelectShortcut)
        }

        this.rowEditting = new RowEditting(
            row, cellID, cellType, cellQuantity, cellTotal, cellList, cellWeight, cellVolume, cellAction, cellSelect
        )
    }

    refreshIDs() {
        if (this.requests.length != this.table.children.length) {
            throw new Error('Requests length mismatch table')
        }
        for (var i = 0; i < this.requests.length; ++i) {
            const row = this.table.children[i]
            const iHuman = i + 1
            row.firstChild.textContent = iHuman
            if (i < 9) {
                row.children[row.children.length - 2].firstChild.lastChild.textContent = ` (shift+${iHuman})`
                row.lastChild.lastChild.textContent = ` (${iHuman})`
            }
        }
    }

    editRequestCallback(buttonEdit) {
        const row = buttonEdit.parentElement.parentElement
        const idFromText = Number(row.firstChild.textContent)
        this.editRequest(idFromText, false)
    }

    editRequest(id, ignoreNonExist) {
        if (id <= 0 || id > this.requests.length) {
            if (ignoreNonExist) {
                return
            } else {
                throw new Error('Trying to edit a request that does not exist!')
            }
        }
        this.beginEdit()

        const row = this.table.children[id - 1]

        const cellID = row.firstChild

        const cellType = cellID.nextSibling
        const type = MaterialTypeStrings.indexOf(cellType.textContent)
        cellType.textContent = ''
        this.fillCellType(cellType, type)

        const cellQuantity = cellType.nextSibling
        const quantity = cellQuantity.textContent
        cellQuantity.textContent = ''
        this.setInputQuantities(cellQuantity, quantity, false)

        const cellTotal = cellQuantity.nextSibling
        const total = cellTotal.textContent
        cellTotal.textContent = ''
        this.setInputQuantities(cellTotal, total, true)

        const cellList = cellTotal.nextSibling
        cellList.textContent = '...'

        const cellWeight = cellList.nextSibling
        cellWeight.textContent = '...'

        const cellVolume = cellWeight.nextSibling
        cellVolume.textContent = '...'

        const cellAction = cellVolume.nextSibling
        cellAction.textContent = ''
        this.fillCellActionConfirm(cellAction)

        const cellSelect = cellAction.nextSibling

        this.rowEditting = new RowEditting(
            row, cellID, cellType, cellQuantity, cellTotal, cellList, cellWeight, cellVolume, cellAction, cellSelect
        )
    }

    inputEnterConfirm() {
        this.rowEditting.inputEnterConfirm()
    }

    updateSummary() {
        var cargos = [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0]
        ]
        for (const request of this.requests) {
            for (const material of request.materials) {
                ++cargos[request.type][material.quantityId]
            }
        }
        tableSummary.updateFromCargos(cargos)
    }

    confirmRequest() {
        const request = this.rowEditting.confirmRequest()
        if (request == null) {
            console.log("Invalid confirm")
        } else {
            this.requests[this.rowEditting.cellID.textContent - 1] = request
            this.rowEditting = null
            this.endEdit()
            this.updateSummary()
        }
    }

    clearRequests() {
        this.requests = []
        this.table.textContent = ''
        this.updateSummary()
    }

    selectAll() {
        for (const row of this.table.children) {
            row.lastChild.firstChild.checked = true
        }
    }

    unselectAll() {
        for (const row of this.table.children) {
            row.lastChild.firstChild.checked = false
        }
    }

    selectRequest(id) {
        if (id <= 0 || id > this.requests.length) {
            return
        }
        const checkbox = this.table.children[id - 1].lastChild.firstChild
        if (checkbox.checked) {
            checkbox.checked = false
        } else {
            checkbox.checked = true
        }
    }

    deleteSelected() {
        console.log("Deleting!")
        for (var i = this.requests.length - 1; i >= 0; --i) {
            const row = this.table.children[i]
            if (row.lastChild.firstChild.checked) {
                this.table.deleteRow(i)
                this.requests.splice(i, 1)
            }
        }
        this.refreshIDs()
        this.updateSummary()
    }
}

const tableRequests = new TableRequests()