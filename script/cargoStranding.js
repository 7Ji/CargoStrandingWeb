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
        var size = MaterialSizes[quantityId]
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

    getDescribeParagraph() {
        var quantities = MaterialQuantities[this.type]
        var cargos = [ 0, 0, 0, 0, 0, 0, 0 ]
        for (const material of this.materials) {
            ++cargos[material.quantityId]
        }
        var lines = []
        for (var i = 0; i < 7; ++i) {
            if (cargos[i]) {
                lines.push(`${MaterialTypeStrings[this.type]} (${quantities[i]}) * ${cargos[i]}`)
            }
        }
        return lines.join("<br>")
    }
}

class Pool {
    constructor() {
        var table = document.getElementById('tbRequests')
        if (table == null) {
            throw new Error('Failed to find table')
        }
        // var summary = document.getElementById('tbSummary')
        // if (summary == null) {
        //     throw new Error("Failed to get summary table")
        // }
        var rowResins = document.getElementById('trResins')
        if (rowResins == null) {
            throw new Error("Failed to get row of Resins in summary")
        }
        var rowMetals = document.getElementById('trMetals')
        if (rowMetals == null) {
            throw new Error("Failed to get row of Metals in summary")
        }
        var rowCeramics = document.getElementById('trCeramics')
        if (rowCeramics == null) {
            throw new Error("Failed to get row of Ceramics in summary")
        }
        var rowChemicals = document.getElementById('trChemicals')
        if (rowChemicals == null) {
            throw new Error("Failed to get row of Chemicals in summary")
        }
        var rowSpecialAlloys = document.getElementById('trSpecialAlloys')
        if (rowSpecialAlloys == null) {
            throw new Error("Failed to get row of Special Alloys in summary")
        }
        this.table = table
        this.summaryRows = [
            rowResins,
            rowMetals,
            rowCeramics,
            rowChemicals,
            rowSpecialAlloys
        ]
        this.requests = []
        this.edit = 0
        this.row = null
        this.btTypes = document.getElementsByClassName('btTypes')
        this.ttTypes = document.getElementById('ttTypes')
    }

    noEdit() {
        if (this.edit) {
            throw new Error("Illegal to create new request when editting")
        }
    }

    intoEdit() {
        for (const button of this.btTypes) {
            button.setAttribute('disabled', '')
        }
        this.ttTypes.removeAttribute('hidden')
        this.edit = 1
    }

    outOfEdit() {
        for (const button of this.btTypes) {
            button.removeAttribute('disabled')
        }
        this.ttTypes.setAttribute('hidden', '')
        this.edit = 0
    }

    newRequest(type) {
        this.noEdit()
        isMaterialTypeIllegal(type)
        var row = this.table.insertRow()
        var cellID = row.insertCell()
        cellID.innerHTML = this.requests.length + 1
        var cellType = row.insertCell()
        var selected = [
            "", "", "", "", ""
        ]
        selected[type] = "selected"
        cellType.innerHTML = `\
            <select>\
                <option ${selected[0]}>${MaterialTypeStrings[0]}</option>\
                <option ${selected[1]}>${MaterialTypeStrings[1]}</option>\
                <option ${selected[2]}>${MaterialTypeStrings[2]}</option>\
                <option ${selected[3]}>${MaterialTypeStrings[3]}</option>\
                <option ${selected[4]}>${MaterialTypeStrings[4]}</option>\
            </select>\
        `
        var cellQuantity = row.insertCell()
        cellQuantity.innerHTML = '<input type="number" min="0" placeholder="" required="required" onkeypress="return (event.charCode !=8 && event.charCode ==0 || (event.charCode >= 48 && event.charCode <= 57))">'
        var cellTotal = row.insertCell()
        cellTotal.innerHTML = '<input type="number" min="0" placeholder="leave empty unless needed" onkeypress="return (event.charCode !=8 && event.charCode ==0 || (event.charCode >= 48 && event.charCode <= 57))">'
        var cellMaterial = row.insertCell()
        cellMaterial.innerHTML = '...'
        var cellAction = row.insertCell()
        cellAction.innerHTML = '<button onclick="pool.confirmRequest()">Confirm</button>'

        this.intoEdit()

        this.row = row
        this.cellID = cellID
        this.cellType = cellType
        this.selectType = cellType.children[0]
        this.cellQuantity = cellQuantity
        this.inputQuantity = cellQuantity.children[0]
        this.cellTotal = cellTotal
        this.inputTotal = cellTotal.children[0]
        this.cellMaterial = cellMaterial
        this.cellAction = cellAction
    }

    closeRequest() {
        this.cellType.innerHTML = this.selectType.value
        this.cellQuantity.innerHTML = this.inputQuantity.value
        this.cellTotal.innerHTML = this.inputTotal.value
        this.cellAction.innerHTML = ''

        this.outOfEdit()
        
        this.row = null
        this.cellID = null
        this.cellType = null
        this.selectType = null
        this.cellQuantity = null
        this.inputQuantity = null
        this.cellTotal = null
        this.inputTotal = null
        this.cellMaterial = null
        this.cellAction = null
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
        for (var i = 0; i < 5; ++i) {
            for (var j = 0; j < 7; ++j) {
                if (cargos[i][j] > 0) {
                    this.summaryRows[i].children[j+1].innerHTML = cargos[i][j]
                } else {
                    this.summaryRows[i].children[j+1].innerHTML = ''
                }
            }
        }
    }

    confirmRequest() {
        var quantityString = this.inputQuantity.value
        if (quantityString == "") {
            alert("The needed/added quantity must NOT be empty!")
            return
        }
        var quantity = Number(quantityString)
        if (!Number.isSafeInteger(quantity) || quantity < 0) {
            alert("The needed/added quantity must be a valid non-negative integer!")
            return
        }
        var totalString = this.inputTotal.value
        if (totalString == "") {
            if (quantity == 0) {
                alert("The total quantity must NOT be empty when added quantity is 0!")
                return
            }
        } else {
            var total = Number(totalString)
            if (!Number.isSafeInteger(total) || total < 0) {
                alert("The total quantity must be a valid non-negative integer!")
                return
            }
            if (total > quantity) {
                quantity = total - quantity
            } else {
                alert("The total quantity must be greater than added quantity!")
                return
            }
        }
        var typeString = this.selectType.value
        var type
        for (type = 0; type < 5; ++type) {
            if (MaterialTypeStrings[type] == typeString) {
                break
            }
        }
        if (type == 5) {
            throw new Error("Failed to find request type")
        }
        var request = new MaterialRequest(type, quantity)
        this.cellMaterial.innerHTML = request.getDescribeParagraph()
        this.requests.push(request)
        this.closeRequest()
        this.updateSummary()
    }

    clearRequests() {
        for (var i = 0; i < this.requests.length; ++i) {
            this.table.deleteRow(-1)
            this.requests.pop()
        }
        if (this.edit) {
            this.table.deleteRow(-1)
            // this.outOfEdit()
        }
        this.requests = [] // Just for safety
        this.outOfEdit()
        this.row = null
    }
}

var pool = new Pool()


function swapGrey() {
    if (edit) {
        for (const button of document.getElementsByClassName('btTypes')) {
            button.removeAttribute('disabled')
        }
        for (const text of document.getElementsByClassName('ttTypes')) {
            text.setAttribute('hidden', '')
        }
        edit = 0
    } else {
        for (const button of document.getElementsByClassName('btTypes')) {
            button.setAttribute('disabled', '')
        }
        for (const text of document.getElementsByClassName('ttTypes')) {
            text.removeAttribute('hidden')
        }
        edit = 1
    }
}