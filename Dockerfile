FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime

RUN apt-get update && apt-get install -y git wget build-essential

# Installing Concorde
RUN wget http://www.math.uwaterloo.ca/tsp/concorde/downloads/codes/src/co031219.tgz && tar -xzvf co031219.tgz && cd concorde \
&& mkdir qsopt && cd qsopt \
&& wget http://www.math.uwaterloo.ca/~bico/qsopt/beta/codes/mac64/qsopt \
&& wget http://www.math.uwaterloo.ca/~bico/qsopt/beta/codes/mac64/qsopt.a \
&& wget http://www.math.uwaterloo.ca/~bico/qsopt/beta/codes/mac64/qsopt.h && cd .. \
&& ./configure --with-qsopt=/app/concorde/qsopt && make
ENV PATH="/app/concorde/TSP/concorde/:${PATH}"
# Install pyconcorde
RUN git clone https://github.com/jvkersch/pyconcorde && cd pyconcorde && pip install -e .

WORKDIR /app

COPY requirements.txt /app
RUN pip install -r requirements.txt

COPY . /app

CMD ["python", "app.py"]
