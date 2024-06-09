from inference.models import Jung, Bresson

MODEL_DICT = {
    'jung-tsp50-m5': {
        'instance': Jung,
        'weights': 'weights/jung-tsp50-m5.pt',
        'forward': lambda model, x: model.forward(x, 0, True, False)[0],
        'type': 'NN'
    },
    'jung-tsp100-m5': {
        'instance': Jung,
        'weights': 'weights/jung-tsp100-m5.pt',
        'forward': lambda model, x: model.forward(x, 0, True, False)[0],
        'type': 'NN'
    },
    'bresson-tsp50': {
        'instance': Bresson,
        'weights': 'weights/bresson-tsp50.pt',
        'forward': lambda model, x: model.forward(x, 0, True, False)[0],
        'type': 'NN'
    },
    'bresson-tsp100': {
        'instance': Bresson,
        'weights': 'weights/bresson-tsp100.pt',
        'forward': lambda model, x: model.forward(x, 0, True, False)[0],
        'type': 'NN'
    },
    'ortools-test': {
        'type': 'ortools'
    }
}